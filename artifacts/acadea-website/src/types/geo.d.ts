declare module "d3-geo" {
  type Rotation = [number, number, number] | [number, number];

  interface GeoProjection {
    scale(s: number): this;
    translate(t: [number, number]): this;
    clipAngle(a: number): this;
    rotate(r: Rotation): this;
    (point: [number, number]): [number, number] | null;
  }

  interface GeoPath {
    (feature: GeoPermissibleObjects | null | undefined): string | null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type GeoPermissibleObjects = any;

  export function geoOrthographic(): GeoProjection;
  export function geoPath(projection: GeoProjection): GeoPath;
  export function geoGraticule(): () => GeoPermissibleObjects;
}

declare module "topojson-client" {
  export function feature(
    topology: unknown,
    object: unknown,
  ): { features: Array<{ id?: string | number; type: string; geometry: unknown; properties: Record<string, unknown> }> };
}

declare module "world-atlas/countries-110m.json" {
  const value: unknown;
  export default value;
}
