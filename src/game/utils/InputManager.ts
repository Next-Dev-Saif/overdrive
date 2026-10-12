export class InputManager {
    private clearKeys = () => { this.keys = {}; this.joystickThrottle = 0; this.joystickSteer = 0; };
    public keys: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.clearKeys);
    }

    private onKeyDown = (e: KeyboardEvent) => {
        this.keys[e.key.toLowerCase()] = true;
    }

    public joystickThrottle: number = 0;
    public joystickSteer: number = 0;
    public joystickFiring: boolean = false;
    public joystickAbility: boolean = false;

    private onKeyUp = (e: KeyboardEvent) => {
        this.keys[e.key.toLowerCase()] = false;
    }

    public isKeyDown(key: string): boolean {
        return !!this.keys[key.toLowerCase()];
    }

    public dispose() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.clearKeys);
    }
}
