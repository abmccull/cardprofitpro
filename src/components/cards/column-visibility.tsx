import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Column {
  key: string;
  label: string;
  defaultVisible?: boolean;
  sortable?: boolean;
}

interface ColumnVisibilityProps {
  columns: Column[];
  visibleColumns: string[];
  onVisibilityChange: (columns: string[]) => void;
  onOrderChange?: (columns: string[]) => void;
}

interface SortableItemProps {
  id: string;
  label: string;
  isVisible: boolean;
  onVisibilityChange: (checked: boolean) => void;
}

function SortableItem({ id, label, isVisible, onVisibilityChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center px-2 py-1 hover:bg-accent cursor-move"
    >
      <div {...attributes} {...listeners} className="mr-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center flex-grow gap-2">
        <Checkbox
          checked={isVisible}
          onCheckedChange={onVisibilityChange}
          id={`column-${id}`}
        />
        <label
          htmlFor={`column-${id}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
    </div>
  );
}

export function ColumnVisibility({
  columns,
  visibleColumns,
  onVisibilityChange,
  onOrderChange
}: ColumnVisibilityProps) {
  const [items, setItems] = React.useState(columns.map(col => col.key));
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        onOrderChange?.(newOrder);
        return newOrder;
      });
    }
  };

  const handleVisibilityChange = (checked: boolean, columnKey: string) => {
    if (checked) {
      onVisibilityChange([...visibleColumns, columnKey]);
    } else {
      // Prevent unchecking if it's the last visible column
      if (visibleColumns.length === 1) return;
      onVisibilityChange(visibleColumns.filter((key) => key !== columnKey));
    }
  };

  const selectAll = () => {
    onVisibilityChange(columns.map(col => col.key));
  };

  const clearAll = () => {
    // Keep at least one column visible
    onVisibilityChange(['name']);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Columns <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel className="text-center font-bold pb-2">
          Column Filters
        </DropdownMenuLabel>
        <div className="flex justify-between px-2 py-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-accent"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-accent"
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>
        <DropdownMenuSeparator className="my-1" />
        <div className="max-h-[400px] overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map((key) => {
                const column = columns.find(col => col.key === key);
                if (!column) return null;
                return (
                  <SortableItem
                    key={column.key}
                    id={column.key}
                    label={column.label}
                    isVisible={visibleColumns.includes(column.key)}
                    onVisibilityChange={(checked) => handleVisibilityChange(checked, column.key)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 