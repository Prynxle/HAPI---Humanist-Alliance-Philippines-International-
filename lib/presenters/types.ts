export interface WorksWheelItem {
  /** Project name. Shown beside the front card and in the index. */
  title: string;
  /** Cover art. Any src an <img> takes. */
  image: string;
  /** Original source filename, used for related-image matching. */
  fileName?: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  href?: string;
}

export interface WorksWheelBioImage {
  fileName: string;
  src: string;
  width: number;
  height: number;
}
