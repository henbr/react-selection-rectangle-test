import React from "react";
import logo from "./logo.svg";
import "./App.css";

type TreeNode = ItemNode | GroupNode;

interface ItemNode {
  readonly type: "item";
  readonly id: string;
  readonly name: string;
}

interface GroupNode {
  readonly type: "group";
  readonly id: string;
  readonly name: string;
  readonly children: TreeNode[];
}

function App() {
  const treeContainerRef = React.useRef<HTMLDivElement>(null);
  const selectionBoxRef = React.useRef<HTMLDivElement>(null);
  const [p1, setP1] = React.useState<{ x: number; y: number } | null>(null);
  const [p2, setP2] = React.useState<{ x: number; y: number } | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [nodesIds, setNodesIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const selectionBox = selectionBoxRef.current;
    if (!selectionBox) {
      return;
    }
    const treeContainer = treeContainerRef.current;
    if (!treeContainer) {
      return;
    }
    if (p1 && p2) {
      // Selection UI
      document.body.classList.add("tree-container-selecting");
      const treeX = treeContainer.offsetLeft;
      const treeY = treeContainer.offsetTop;
      selectionBox.style.visibility = "visible";
      selectionBox.style.left = `${Math.min(p1.x, p2.x) - treeX}px`;
      selectionBox.style.top = `${Math.min(p1.y, p2.y) - treeY}px`;
      selectionBox.style.width = `${Math.abs(p2.x - p1.x)}px`;
      selectionBox.style.height = `${Math.abs(p2.y - p1.y)}px`;

      // Positions of all child DOM elements
      const selectionBoxRect = selectionBox.getBoundingClientRect();
      const children = Array.from(treeContainer.querySelectorAll("*"))
        .filter((c) => !!c.id)
        .map((child) => {
          const childRect = child.getBoundingClientRect();
          return {
            element: child,
            intersecting:
              childRect.left < selectionBoxRect.right &&
              childRect.right > selectionBoxRect.left &&
              childRect.top < selectionBoxRect.bottom &&
              childRect.bottom > selectionBoxRect.top,
          };
        });
      const intersectedIds = children
        .filter((c) => c.intersecting)
        .map((child) => child.element.id);
      setSelectedIds(intersectedIds);
      for (const { element, intersecting } of children) {
        if (intersecting) {
          element.classList.add("selected");
        } else {
          element.classList.remove("selected");
        }
      }
    } else {
      window?.getSelection()?.removeAllRanges();
      document.body.classList.remove("tree-container-selecting");
      selectionBox.style.visibility = "hidden";
      //      for (const id of Array.from(nodesIds.values())) {
      //        const element = document.getElementById(id);
      //        if (element) {
      //          element.classList.remove("selected");
      //        }
      //      }
    }
  }, [p1, p2, nodesIds]);

  return (
    <div className="App">
      <h1>Selection App</h1>
      <div className="container ">
        <div>
          <h2>Items</h2>
          <div
            className="tree-container"
            ref={treeContainerRef}
            onMouseDown={(e) => {
              setP1({ x: e.pageX, y: e.pageY });
              setP2({ x: e.pageX, y: e.pageY });
            }}
            onMouseUp={(e) => {
              setP1(null);
              setP2(null);
              setNodesIds(new Set(selectedIds));
              setSelectedIds([]);
            }}
            onMouseMove={(e) => {
              if (!p1) {
                return;
              }
              setP2({ x: e.pageX, y: e.pageY });
            }}
          >
            <div className="selection-box" ref={selectionBoxRef}></div>
            <Tree node={testTree} selectedNodes={nodesIds} />
          </div>
        </div>
        <div>
          <h2>Selected Items</h2>
          <button onClick={() => setNodesIds(new Set())}>
            Clear selection
          </button>
          <ul>
            {Array.from(nodesIds.values()).map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Tree({
  node,
  selectedNodes,
}: {
  node: TreeNode;
  selectedNodes: Set<string>;
}) {
  return (
    <div>
      {node.type === "item" ? (
        <Item node={node} selected={selectedNodes.has(node.id)} />
      ) : (
        <Group node={node} selectedNodes={selectedNodes} />
      )}
    </div>
  );
}

function Item({
  node,
  selected,
  isGroup = false,
}: {
  node: TreeNode;
  selected: boolean;
  isGroup?: boolean;
}) {
  const itemRef = React.useRef<HTMLDivElement>(null);
  return (
    <div
      ref={itemRef}
      className={`item ${selected ? "selected" : ""} ${
        isGroup ? "group-open" : ""
      }`}
      id={node.id}
      draggable={true}
      onDragStart={(e) => {
        //        e.preventDefault();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onDragOver={(e) => {
        const item = itemRef.current;
        if (item) {
          //item.classList.add("drag-over");
          const mouseY = e.clientY;
          const rect = item.getBoundingClientRect();
          const middle = rect.top + rect.height / 2;
          if (mouseY < middle) {
            item.classList.add("drag-above");
            item.classList.remove("drag-below");
            // Above
          } else {
            item.classList.add("drag-below");
            item.classList.remove("drag-above");
          }
        }
        e.preventDefault();
      }}
      onDragLeave={(e) => {
        const item = itemRef.current;
        if (item) {
          item.classList.remove("drag-over");
          item.classList.remove("drag-above");
          item.classList.remove("drag-below");
        }
      }}
      onDrop={(e) => {
        const item = itemRef.current;
        if (item) {
          item.classList.remove("drag-over");
          item.classList.remove("drag-above");
          item.classList.remove("drag-below");
        }
      }}
    >
      {node.name}{" "}
    </div>
  );
}

function Group({
  node,
  selectedNodes,
}: {
  node: GroupNode;
  selectedNodes: Set<string>;
}) {
  return (
    <div>
      <Item node={node} selected={selectedNodes.has(node.id)} isGroup />
      <div className="group">
        {node.children.map((child) => (
          <Tree key={child.id} node={child} selectedNodes={selectedNodes} />
        ))}
      </div>
    </div>
  );
}

export default App;

const testTree: TreeNode = {
  type: "group",
  id: "1",
  name: "Group 1",
  children: [
    {
      type: "item",
      id: "111",
      name: "Item 111",
    },
    {
      type: "item",
      id: "211",
      name: "Item 211",
    },
    {
      type: "group",
      id: "2",
      name: "Group 2",
      children: [
        {
          type: "item",
          id: "3",
          name: "Item 3",
        },
        {
          type: "item",
          id: "4",
          name: "Item 4",
        },
        {
          type: "group",
          id: "5",
          name: "Group 5",
          children: [
            {
              type: "item",
              id: "7",
              name: "Item 7",
            },
            {
              type: "item",
              id: "8",
              name: "Item 8",
            },
          ],
        },
      ],
    },
    {
      type: "group",
      id: "9",
      name: "Group 9",
      children: [
        {
          type: "item",
          id: "10",
          name: "Item 10",
        },
        {
          type: "item",
          id: "11",
          name: "Item 11",
        },
        {
          type: "group",
          id: "12",
          name: "Group 12",
          children: [
            {
              type: "item",
              id: "13",
              name: "Item 13",
            },
            {
              type: "item",
              id: "14",
              name: "Item 14",
            },
          ],
        },
      ],
    },
    {
      type: "group",
      id: "15",
      name: "Group 15",
      children: [
        {
          type: "item",
          id: "16",
          name: "Item 16",
        },
        {
          type: "item",
          id: "17",
          name: "Item 17",
        },
        {
          type: "group",
          id: "18",
          name: "Group 18",
          children: [
            {
              type: "item",
              id: "19",
              name: "Item 19",
            },
            {
              type: "item",
              id: "20",
              name: "Item 20",
            },
          ],
        },
      ],
    },
  ],
};
