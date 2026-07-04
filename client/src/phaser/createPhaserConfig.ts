import Phaser from "phaser";
import { getClassColor } from "../services/content";

export type TacticalToken = {
  id: string;
  name: string;
  classId: string;
  className: string;
  tokenKind: "player" | "enemy";
  x: number;
  y: number;
  isActiveTurn: boolean;
  isSelf: boolean;
};

export type TacticalSnapshot = {
  width: number;
  height: number;
  tokens: TacticalToken[];
};

type TokenSprite = {
  body: Phaser.GameObjects.Ellipse | Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Ellipse | Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type GameBridge = {
  sync(snapshot: TacticalSnapshot): void;
  destroy(): void;
};

const tileSize = 48;

class TacticalScene extends Phaser.Scene {
  private readonly tokens = new Map<string, TokenSprite>();
  private readonly snapshot: TacticalSnapshot = {
    width: 10,
    height: 8,
    tokens: []
  };
  private grid?: Phaser.GameObjects.Graphics;
  private isReady = false;

  constructor(private readonly onTileSelected: (x: number, y: number) => void) {
    super("tactical-scene");
  }

  create() {
    this.isReady = true;
    this.cameras.main.setBackgroundColor("#111827");
    this.grid = this.add.graphics();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const x = Math.floor(pointer.x / tileSize);
      const y = Math.floor(pointer.y / tileSize);

      if (x < 0 || y < 0 || x >= this.snapshot.width || y >= this.snapshot.height) {
        return;
      }

      this.onTileSelected(x, y);
    });
    this.renderSnapshot();
  }

  setSnapshot(snapshot: TacticalSnapshot) {
    this.snapshot.width = snapshot.width;
    this.snapshot.height = snapshot.height;
    this.snapshot.tokens = snapshot.tokens;

    if (this.isReady) {
      this.renderSnapshot();
    }
  }

  private renderSnapshot() {
    this.scale.resize(this.snapshot.width * tileSize, this.snapshot.height * tileSize);
    this.drawGrid();

    const visibleTokenIds = new Set(this.snapshot.tokens.map((token) => token.id));

    for (const [tokenId, sprite] of this.tokens.entries()) {
      if (!visibleTokenIds.has(tokenId)) {
        sprite.body.destroy();
        sprite.border.destroy();
        sprite.label.destroy();
        this.tokens.delete(tokenId);
      }
    }

    for (const token of this.snapshot.tokens) {
      const centerX = token.x * tileSize + tileSize / 2;
      const centerY = token.y * tileSize + tileSize / 2;
      const tint = getClassColor(token.classId);
      let sprite = this.tokens.get(token.id);

      if (!sprite) {
        const body =
          token.tokenKind === "enemy"
            ? this.add.ellipse(centerX, centerY, 28, 28, tint)
            : this.add.rectangle(centerX, centerY, 28, 28, tint);
        const border =
          token.tokenKind === "enemy"
            ? this.add.ellipse(centerX, centerY, 34, 34)
            : this.add.rectangle(centerX, centerY, 34, 34);

        sprite = {
          body,
          border,
          label: this.add.text(centerX, centerY + 22, token.name, {
            color: "#f8fafc",
            fontFamily: "Arial",
            fontSize: "12px"
          })
        };
        sprite.border.setStrokeStyle(2, 0xffffff);
        sprite.label.setOrigin(0.5, 0);
        this.tokens.set(token.id, sprite);
      }

      sprite.body.setPosition(centerX, centerY).setFillStyle(tint);
      sprite.border
        .setPosition(centerX, centerY)
        .setStrokeStyle(
          token.isActiveTurn ? 3 : 2,
          token.tokenKind === "enemy" ? 0xf97316 : token.isSelf ? 0xfacc15 : 0xffffff
        );
      sprite.label.setPosition(centerX, centerY + 22).setText(token.name);
    }
  }

  private drawGrid() {
    if (!this.grid) {
      return;
    }

    this.grid.clear();
    this.grid.lineStyle(1, 0x334155, 1);

    for (let column = 0; column <= this.snapshot.width; column += 1) {
      const x = column * tileSize;
      this.grid.lineBetween(x, 0, x, this.snapshot.height * tileSize);
    }

    for (let row = 0; row <= this.snapshot.height; row += 1) {
      const y = row * tileSize;
      this.grid.lineBetween(0, y, this.snapshot.width * tileSize, y);
    }
  }
}

export function createGameBridge(
  parent: string,
  onTileSelected: (x: number, y: number) => void
): GameBridge {
  const scene = new TacticalScene(onTileSelected);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: tileSize * 10,
    height: tileSize * 8,
    parent,
    scene: [scene],
    render: {
      antialias: true,
      pixelArt: true
    }
  });

  return {
    sync(snapshot) {
      scene.setSnapshot(snapshot);
    },
    destroy() {
      game.destroy(true);
    }
  };
}
