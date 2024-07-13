import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Card from "../components/Card";

const initialData = {
  allCards: [],
  notInterested: [],
  visitLater: [],
  converted: [],
};

function capitalizeWords(str) {
  return str.replace(/([A-Z])/g, " $1").trim().replace(/\b\w/g, char => char.toUpperCase());
}

function DraggableItem({ id, title, description, image, borderColor }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card title={title} description={description} image={image} borderColor={borderColor} />
    </div>
  );
}

function DroppableContainer({ id, items, children, horizontal = false }) {
  const { setNodeRef } = useDroppable({
    id,
  });

  const borderColorMap = {
    notInterested: 'border-red-500',
    visitLater: 'border-purple-500',
    converted: 'border-green-500',
  };

  return (
    <div ref={setNodeRef} className={`bg-gray-800 p-4 rounded-lg items-center ${horizontal ? 'flex space-x-4 overflow-x-auto' : 'min-h-[400px] flex flex-col space-y-4'}`}>
      {children}
      <SortableContext items={Array.isArray(items) ? items : []} strategy={horizontal ? horizontalListSortingStrategy : verticalListSortingStrategy}>
        {Array.isArray(items) ? items.map((item) => (
          <DraggableItem
            key={item.id}
            id={item.id}
            title={item.name}
            description={item.description}
            image={item.image_url}
            borderColor={borderColorMap[id]}
          />
        )) : <div className="p-4 text-gray-400">Drop items here</div>}
        {Array.isArray(items) && items.length === 0 && <div className="p-4 text-gray-400">Drop items here</div>}
      </SortableContext>
    </div>
  );
}

function Board() {
  const [data, setData] = useState(initialData);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://40.118.175.224/items");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Fetched data:", result);
        if (Array.isArray(result)) {
          setData((prevData) => ({
            ...prevData,
            allCards: result,
          }));
        } else {
          console.error("Fetched data is not an array:", result);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleDragStart = (event) => {
    console.log("Drag started:", event.active.id);
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    console.log("Drag ended. Active:", active.id, "Over:", over?.id);

    if (!over) {
      setActiveId(null);
      return;
    }

    const sourceList = findSource(active.id);
    const destinationList = { droppableId: over.id, index: data[over.id].length };

    if (!sourceList || !destinationList) {
      setActiveId(null);
      return;
    }

    console.log("Source list:", sourceList);
    console.log("Destination list:", destinationList);

    if (sourceList.droppableId !== destinationList.droppableId) {
      moveItemBetweenLists(sourceList, destinationList);
    }

    setActiveId(null);
  };

  const findSource = (id) => {
    for (const key in data) {
      const index = data[key].findIndex((item) => item.id === id);
      if (index !== -1) {
        return { droppableId: key, index };
      }
    }
    return null;
  };

  const moveItemBetweenLists = (source, destination) => {
    const sourceItems = [...data[source.droppableId]];
    const [removed] = sourceItems.splice(source.index, 1);
    const destinationItems = [...data[destination.droppableId]];
    destinationItems.splice(destination.index, 0, removed);

    setData((prevData) => ({
      ...prevData,
      [source.droppableId]: sourceItems,
      [destination.droppableId]: destinationItems,
    }));
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 bg-gray-100 min-h-screen">
        <div className="flex space-x-4 mb-8">
          <DroppableContainer id="allCards" items={data.allCards} horizontal>
            <h2 className="text-white text-xl mb-4">All Cards</h2>
          </DroppableContainer>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {["notInterested", "visitLater", "converted"].map((key) => (
            <DroppableContainer key={key} id={key} items={data[key]}>
              <h2 className="text-white text-xl mb-4">
                {capitalizeWords(key)}
              </h2>
            </DroppableContainer>
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          <Card
            {...data.allCards.find((item) => item.id === activeId) ||
              data.notInterested.find((item) => item.id === activeId) ||
              data.visitLater.find((item) => item.id === activeId) ||
              data.converted.find((item) => item.id === activeId)}
            id={activeId}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default Board;
