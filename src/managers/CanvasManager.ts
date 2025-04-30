import type { Collection } from "mongodb"
import { utils } from "../extra/Utils"
import type { MongoPixel } from "../models/MongoPixel"
import { BaseManager } from "./BaseManager"

type Point = {
  x: number
  y: number
}

export class CanvasManager extends BaseManager<MongoPixel> {
  static readonly BITS_PER_PIXEL = 3

  #pixels: Map<`${number}:${number}`, MongoPixel>
  #changes: Point[]
  #colors: Uint8ClampedArray | undefined

  constructor(
    collection: Collection<MongoPixel>,
    public width: number,
    public height: number,
  ) {
    super(collection)

    this.#pixels = new Map()
    this.#changes = []
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height

    this.resetColors()
  }

  get pixels() {
    return Array.from(this.#pixels.values())
  }

  #computeColors() {
    const colors = new Uint8ClampedArray(
      this.width * this.height * CanvasManager.BITS_PER_PIXEL,
    )

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const pixel = this.select({ x, y })

        const colorComponents = utils.translateHex(pixel.color)

        const offset = (y * this.width + x) * CanvasManager.BITS_PER_PIXEL

        colors.set(colorComponents, offset)
      }
    }

    return colors
  }

  get colors() {
    if (!this.#colors) {
      this.#colors = this.#computeColors()
    }

    return this.#colors
  }

  resetColors() {
    this.#colors = undefined
  }

  async init() {
    const pixels = await this.collection
      .find({}, { projection: { _id: 0 } })
      .toArray()
      .then(pixels =>
        pixels.map(pixel => {
          return [`${pixel.x}:${pixel.y}`, pixel] as const
        }),
      )

    this.#pixels = new Map(pixels)

    return this.#pixels
  }

  sendPixels() {
    const bulk = this.#changes.map(point => {
      const pixel = this.select(point)

      return {
        updateOne: {
          filter: point,
          update: {
            $set: pixel,
          },
        },
      }
    })

    if (bulk.length) this.collection.bulkWrite(bulk)

    this.#changes = []

    return this.#pixels
  }

  select({ x, y }: Point) {
    return (
      this.#pixels.get(`${x}:${y}`) ??
      ({ author: null, tag: null, x, y, color: "#ffffff" } satisfies MongoPixel)
    )
  }

  async clear(_color: string) {
    await this.collection.drop()

    this.#changes = []
    this.#pixels = new Map()
    this.resetColors()

    return this.#pixels
  }

  paint(pixel: MongoPixel) {
    this.#setColor({ x: pixel.x, y: pixel.y }, pixel.color)
    this.#pixels.set(`${pixel.x}:${pixel.y}`, pixel)

    this.#changes.push({ x: pixel.x, y: pixel.y })

    return pixel
  }

  getColor(point: Point) {
    return this.select(point).color
  }

  #setColor({ x, y }: Point, color: string) {
    const offset = (x + y * this.width) * CanvasManager.BITS_PER_PIXEL
    const colorComponents = utils.translateHex(color)

    this.colors.set(colorComponents, offset)
  }
}
