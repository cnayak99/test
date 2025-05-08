"use client"
import React, { useCallback, useRef } from "react";
import {
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type OnConnect,
  type OnConnectEnd
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import TextNode from "../components/TextNode";

const nodeTypes = {
  text: TextNode,
};
const initialNodes = [
  {
    id: "0",
    type: "text",
    data: {
      text: "",
      isFirst: true,
    },
    position: { x: 0, y: 50 },
  },
];

let id = 1;
const getId = () => `${id++}`;
const nodeOrigin:[number,number] = [0.5, 0];

const AddNodeOnEdgeDrop = () => {
  const reactFlowWrapper = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);


  const { screenToFlowPosition } = useReactFlow();
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const id = getId();
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const newNode:Node = {
          id,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          type: "text",
          data: {
            text: "",
            isFirst: false,
          },
          origin: [0.5, 0.0],
        };
        if (connectionState.fromNode) {
          setNodes((nds) => nds.concat(newNode));
          setEdges((eds) =>
            eds.concat({ id, source: connectionState.fromNode!.id, target: id })
          );
        }
      }
    },
    [screenToFlowPosition]
  );

  function findFirstNode(nodes:Node[],edges:Edge[]){
    const targetIds = new Set(edges.map(e=>e.target));
    return nodes.find(n=>!targetIds.has(n.id));
  }

  function findLinearOrder(startId:string,edges:Edge[]){
    const order = [startId];
    const edgeMap = new Map(edges.map(e=>[e.source,e.target]));
    let current = startId;
    while(edgeMap.has(current)){
      const next = edgeMap.get(current);
      if(!next){
        console.log("First node not found");
        return;
      }
      order.push(next);
      current=next;
    }
    return order;
  }
  async function runWorkflow() {
    const firstNode = findFirstNode(nodes, edges);
    if (!firstNode) return;

    const execOrder = findLinearOrder(firstNode.id, edges);
    if (!execOrder) return;

    for (let i = 0; i < execOrder.length; i++) {
      const nodeId = execOrder[i];
      const node = nodes.find((n) => n.id === nodeId);
      const script = node?.data.text || "";

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isExecuting: n.id === nodeId,
            result: n.id === nodeId ? undefined : n.data.result, 
            stdout: n.id === nodeId ? undefined : n.data.stdout,
          },
        }))
      );

      const res = await fetch("api/execute-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scripts: [script] }),
      });

      const data = await res.json();
      const result = data.results?.[0] || { result: "", stdout: "" };
      console.log("Execution result for node", nodeId, data);

      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  result: result.result,
                  stdout: result.stdout,
                  isExecuting: false,
                },
              }
            : n
        )
      );

      await new Promise((res) => setTimeout(res, 200));
    }
    

  }
  const addNodeManually = () => {
    const idStr = getId();
    const newNode: Node = {
      id: idStr,
      type: "text",
      position: { x: 250, y: 100 }, // You can randomize or offset this
      data: {
        text: "",
        isFirst: false,
      },
      origin: [0.5, 0.0],
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div
      className="wrapper flex"
      ref={reactFlowWrapper}
      style={{ width: "100%", height: "100vh", position: "relative" }}
    >
      <ReactFlow
        style={{ backgroundColor: "#F7F9FB" }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        fitView
        nodeTypes={nodeTypes}
        fitViewOptions={{ padding: 2 }}
        nodeOrigin={nodeOrigin}
      >
        <button
          onClick={runWorkflow}
          className="bg-blue-500 z-10 absolute hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
        >
          Run Workflow
        </button>
        <button
          onClick={addNodeManually}
          className="absolute top-4 right-4 z-20 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Node
        </button>
        <Background />
      </ReactFlow>
    </div>
  );  
};

const Workflow =  () => (
  <ReactFlowProvider>
    <AddNodeOnEdgeDrop />
  </ReactFlowProvider>
);

export default Workflow;
