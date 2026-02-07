/*
 * :file description: 
 * :name: /react-pageflip-master/src/page-flip/BasicTypes.ts
 * :author: PTC
 * :copyright: (c) 2026, Tungee
 * :date created: 2021-04-18 23:11:19
 * :last editor: PTC
 * :date last edited: 2026-02-08 00:12:08
 */
/**
 * Type representing a point on a plane
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Type representing a coordinates of the rectangle on the plane
 */
export interface RectPoints {
    /** Coordinates of the top left corner */
    topLeft: Point;
    /** Coordinates of the top right corner */
    topRight: Point;
    /** Coordinates of the bottom left corner */
    bottomLeft: Point;
    /** Coordinates of the bottom right corner */
    bottomRight: Point;
}

/**
 * Type representing a rectangle
 */
export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Type representing a book area
 */
export interface PageRect {
    left: number;
    top: number;
    width: number;
    height: number;
    /** Page width. If portrait mode is equal to the width of the book. In landscape mode - half of the total width. */
    pageWidth: number;
}

/**
 * Type representing a line segment contains two points: start and end
 */
export type Segment = [Point, Point];
