/** Dane zdjęć zamówienia przekazywane z serwera do galerii (komponent klienta). */

export interface GalleryVariant {
  id: string;
  letter: string;
  label: string;
  /** Podgląd w suwaku / lightboxie (w=1600). */
  src: string;
  /** Miniatura (w=200). */
  thumb: string;
  /** Adres pobrania z poprawną nazwą pliku. */
  downloadUrl: string;
  fileName: string;
}

export interface GalleryPhoto {
  id: string;
  /** Numer zdjęcia w zamówieniu (od 1). */
  number: number;
  name: string;
  width: number;
  height: number;
  beforeSrc: string;
  beforeThumb: string;
  variants: GalleryVariant[];
}
