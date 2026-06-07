import Phaser from 'phaser';
import {
  JOYSTICK_RADIUS,
  JOYSTICK_BASE_ALPHA,
  JOYSTICK_THUMB_RADIUS,
  ACTION_BUTTON_SIZE,
} from '@/config/constants';
import { isMobile } from '@/config/game-config';

export class InputManager {
  private direction: { x: number; y: number } = { x: 0, y: 0 };
  private actionPressedFlag: boolean = false;
  private sprintHeld: boolean = false;
  private sprintToggled: boolean = false;
  private scene: Phaser.Scene | null = null;
  private mobile: boolean = false;

  // Touch controls (mobile only)
  private joystickBase: Phaser.GameObjects.Image | null = null;
  private joystickThumb: Phaser.GameObjects.Image | null = null;
  private actionButton: Phaser.GameObjects.Image | null = null;
  private actionLabel: Phaser.GameObjects.Text | null = null;

  private activePointerId: number = -1;
  private joystickCenter: { x: number; y: number } = { x: 0, y: 0 };
  private pointerDownHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  private pointerMoveHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  private pointerUpHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null;

  // Keyboard (desktop)
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  } | null = null;
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private shiftKey: Phaser.Input.Keyboard.Key | null = null;
  private eKey: Phaser.Input.Keyboard.Key | null = null;

  // Desktop keyboard hints
  private keyHints: Phaser.GameObjects.Text | null = null;

  private lastTapTime: number = 0;

  setup(scene: Phaser.Scene): void {
    // Clean up previous bindings before re-binding
    this.cleanup();

    this.scene = scene;
    this.mobile = isMobile();
    this.direction = { x: 0, y: 0 };
    this.actionPressedFlag = false;

    const gameWidth = scene.cameras.main.width;
    const gameHeight = scene.cameras.main.height;

    if (this.mobile) {
      this.setupTouchControls(scene, gameWidth, gameHeight);
    }

    this.setupKeyboard(scene, gameWidth, gameHeight);
  }

  private cleanup(): void {
    if (this.scene?.input) {
      if (this.pointerDownHandler) {
        this.scene.input.off('pointerdown', this.pointerDownHandler);
      }
      if (this.pointerMoveHandler) {
        this.scene.input.off('pointermove', this.pointerMoveHandler);
      }
      if (this.pointerUpHandler) {
        this.scene.input.off('pointerup', this.pointerUpHandler);
      }
      if (this.escKey && this.scene.input.keyboard) {
        this.scene.input.keyboard.removeKey(this.escKey);
      }
    }

    this.pointerDownHandler = null;
    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;

    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
    this.actionButton?.destroy();
    this.actionLabel?.destroy();
    this.keyHints?.destroy();
    this.joystickBase = null;
    this.joystickThumb = null;
    this.actionButton = null;
    this.actionLabel = null;
    this.keyHints = null;
    this.cursors = null;
    this.wasdKeys = null;
    this.spaceKey = null;
    this.shiftKey = null;
    this.eKey = null;
    this.escKey = null;
    this.activePointerId = -1;
  }

  private setupTouchControls(scene: Phaser.Scene, gameWidth: number, gameHeight: number): void {
    const joyX = JOYSTICK_RADIUS + 20;
    const joyY = gameHeight - JOYSTICK_RADIUS - 20;
    this.joystickCenter = { x: joyX, y: joyY };

    const btnX = gameWidth - ACTION_BUTTON_SIZE - 20;
    const btnY = gameHeight - ACTION_BUTTON_SIZE - 20;

    // Joystick
    this.joystickBase = scene.add
      .image(joyX, joyY, 'joystick_base')
      .setScrollFactor(0)
      .setAlpha(JOYSTICK_BASE_ALPHA)
      .setDepth(1000);

    this.joystickThumb = scene.add
      .image(joyX, joyY, 'joystick_thumb')
      .setScrollFactor(0)
      .setAlpha(0.6)
      .setDepth(1001);

    // Action button
    this.actionButton = scene.add
      .image(btnX, btnY, 'action_button')
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();

    this.actionLabel = scene.add
      .text(btnX, btnY, 'ACT', {
        fontSize: '30px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);

    // Touch handlers
    this.pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      const dxJoy = pointer.x - this.joystickCenter.x;
      const dyJoy = pointer.y - this.joystickCenter.y;
      const distJoy = Math.sqrt(dxJoy * dxJoy + dyJoy * dyJoy);

      if (distJoy < JOYSTICK_RADIUS * 2) {
        this.activePointerId = pointer.id;
        const now = Date.now();
        if (now - this.lastTapTime < 300) {
          this.sprintToggled = !this.sprintToggled;
        }
        this.lastTapTime = now;
        return;
      }

      const dxBtn = pointer.x - btnX;
      const dyBtn = pointer.y - btnY;
      const distBtn = Math.sqrt(dxBtn * dxBtn + dyBtn * dyBtn);

      if (distBtn < ACTION_BUTTON_SIZE) {
        this.actionPressedFlag = true;
        if (this.actionButton) {
          scene.tweens.add({
            targets: this.actionButton,
            scaleX: 0.9, scaleY: 0.9,
            duration: 50, yoyo: true,
          });
        }
      }
    };

    this.pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.activePointerId) return;

      const dx = pointer.x - this.joystickCenter.x;
      const dy = pointer.y - this.joystickCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 1) { this.direction = { x: 0, y: 0 }; return; }

      const clampedDist = Math.min(distance, JOYSTICK_RADIUS);
      const deadZone = JOYSTICK_RADIUS * 0.15;

      if (clampedDist < deadZone) {
        this.direction = { x: 0, y: 0 };
      } else {
        const normalizedDist = clampedDist / JOYSTICK_RADIUS;
        const curved = Math.pow(normalizedDist, 1.3);
        this.direction = { x: (dx / distance) * curved, y: (dy / distance) * curved };
      }

      if (this.joystickThumb) {
        this.joystickThumb.setPosition(
          this.joystickCenter.x + (dx / distance) * clampedDist,
          this.joystickCenter.y + (dy / distance) * clampedDist
        );
      }
    };

    this.pointerUpHandler = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.activePointerId) return;
      this.activePointerId = -1;
      this.direction = { x: 0, y: 0 };
      if (this.joystickThumb && this.scene) {
        this.scene.tweens.add({
          targets: this.joystickThumb,
          x: this.joystickCenter.x, y: this.joystickCenter.y,
          duration: 50, ease: 'Power2',
        });
      }
    };

    scene.input.on('pointerdown', this.pointerDownHandler);
    scene.input.on('pointermove', this.pointerMoveHandler);
    scene.input.on('pointerup', this.pointerUpHandler);
  }

  private setupKeyboard(scene: Phaser.Scene, gameWidth: number, gameHeight: number): void {
    if (!scene.input.keyboard) return;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasdKeys = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Desktop: show persistent keyboard hints at bottom of screen
    if (!this.mobile) {
      this.keyHints = scene.add.text(gameWidth / 2, gameHeight - 14,
        'WASD Move  |  E Interact  |  SHIFT Sprint  |  Q Ability  |  TAB Map  |  ESC Pause', {
          fontSize: '10px',
          color: '#555555',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(999);
    }
  }

  update(): void {
    if (this.cursors || this.wasdKeys) {
      let kx = 0;
      let ky = 0;

      if (this.cursors) {
        if (this.cursors.left.isDown) kx -= 1;
        if (this.cursors.right.isDown) kx += 1;
        if (this.cursors.up.isDown) ky -= 1;
        if (this.cursors.down.isDown) ky += 1;
      }

      if (this.wasdKeys) {
        if (this.wasdKeys.A.isDown) kx -= 1;
        if (this.wasdKeys.D.isDown) kx += 1;
        if (this.wasdKeys.W.isDown) ky -= 1;
        if (this.wasdKeys.S.isDown) ky += 1;
      }

      if (kx !== 0 && ky !== 0) {
        const len = Math.sqrt(kx * kx + ky * ky);
        kx /= len;
        ky /= len;
      }

      if (kx !== 0 || ky !== 0) {
        this.direction = { x: kx, y: ky };
      } else if (!this.mobile && this.activePointerId === -1) {
        // On desktop with no touch active, keyboard not pressed = stop
        this.direction = { x: 0, y: 0 };
      }

      // Space OR E key for action
      if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.actionPressedFlag = true;
      }
      if (this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.actionPressedFlag = true;
      }

      this.sprintHeld = this.shiftKey?.isDown ?? false;
    }
  }

  /** Update the action button label (mobile only) */
  setActionLabel(label: string): void {
    if (this.actionLabel) {
      this.actionLabel.setText(label);
    }
  }

  resetActionFlag(): void {
    this.actionPressedFlag = false;
  }

  getDirection(): { x: number; y: number } {
    return { x: this.direction.x, y: this.direction.y };
  }

  isActionPressed(): boolean {
    return this.actionPressedFlag;
  }

  isSprintHeld(): boolean {
    return this.sprintHeld || this.sprintToggled;
  }

  isMobileDevice(): boolean {
    return this.mobile;
  }

  destroy(): void {
    this.cleanup();
    this.scene = null;
  }
}
