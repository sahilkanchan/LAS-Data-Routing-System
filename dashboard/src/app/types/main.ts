import { ComponentType, SVGProps } from "react"

export type HeroIconType = ComponentType<SVGProps<SVGSVGElement>>
export interface NavigationMeta {
  name: string,
  icon: HeroIconType,
  href: (() => string)
}

export interface NavigationStateObj {
  selectedBatchUuidQuery: string | null
}

export type NonNullableObj = NonNullable<object>
export type Nullable<T> = T | null

export type ObjConstructor<T> = new (params: T) => T

export type ServerParams = {
  params?: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};