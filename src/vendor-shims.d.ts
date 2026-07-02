/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare module 'three' {
  export type MeshPhysicalMaterialParameters = Record<string, any>;
  export type MaterialParameters = Record<string, any>;
  export type ShaderLibShader = Record<string, any>;
  export type IUniform<T = any> = { value: T };
  export type NormalBufferAttributes = any;
  export class Material { [key: string]: any; constructor(...args: any[]); }
  export class MeshPhysicalMaterial extends Material { constructor(...args: any[]); }
  export class ShaderMaterial extends Material { [key: string]: any; constructor(...args: any[]); }
  export class Texture { [key: string]: any; constructor(...args: any[]); }
  export class CanvasTexture extends Texture { constructor(...args: any[]); }
  export class Color { [key: string]: any; constructor(...args: any[]); }
  export class Vector2 { [key: string]: any; constructor(...args: any[]); }
  export class Vector3 { [key: string]: any; constructor(...args: any[]); }
  export class Clock { [key: string]: any; constructor(...args: any[]); }
  export class Scene { [key: string]: any; constructor(...args: any[]); }
  export class OrthographicCamera { [key: string]: any; constructor(...args: any[]); }
  export class PerspectiveCamera { [key: string]: any; constructor(...args: any[]); }
  export class WebGLRenderer { [key: string]: any; constructor(...args: any[]); }
  export class BufferGeometry { [key: string]: any; constructor(...args: any[]); }
  export class PlaneGeometry extends BufferGeometry { constructor(...args: any[]); }
  export class SphereGeometry extends BufferGeometry { constructor(...args: any[]); }
  export class BoxGeometry extends BufferGeometry { constructor(...args: any[]); }
  export class BufferAttribute { [key: string]: any; constructor(...args: any[]); }
  export class MeshStandardMaterial extends Material { constructor(...args: any[]); }
  export class AmbientLight { [key: string]: any; constructor(...args: any[]); }
  export class DirectionalLight { [key: string]: any; constructor(...args: any[]); }
  export class Group { [key: string]: any; constructor(...args: any[]); }
  export class Mesh<G = any, M = any> { [key: string]: any; constructor(...args: any[]); }
  export class Uniform<T = any> { value: T; constructor(value: T); }
  export const ShaderLib: any;
  export const UniformsUtils: any;
  export const DoubleSide: any;
  export const FrontSide: any;
  export const BackSide: any;
  export const AdditiveBlending: any;
  export const NormalBlending: any;
  export const LinearFilter: any;
  export const NearestFilter: any;
  export const RGBAFormat: any;
  export const UnsignedByteType: any;
  export const SRGBColorSpace: any;
  export const GLSL3: any;
}

declare module 'jsdom';
