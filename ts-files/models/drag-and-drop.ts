//interface for the drag and drop
export interface Draggable {
    dragStartHandler(event:  DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

export interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(evet: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}