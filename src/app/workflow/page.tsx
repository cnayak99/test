"use client"
import React, { useCallback, useRef, useState } from "react";
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
type ExecutionUpdate ={
  result:string,
  stdout:string
}
const AddNodeOnEdgeDrop = () => {
  const reactFlowWrapper = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [executionUpdate, setExecutionUpdate] = useState<ExecutionUpdate[]>([]);

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
  async function runWorkflow(){
    const firstNode = findFirstNode(nodes,edges);
    if(!firstNode) return;
    const execOrder = findLinearOrder(firstNode.id,edges);

    const scripts = execOrder?.map(eo=>{
      const node = nodes.find(n=>n.id==eo);
      return node?.data.text||"";
    })

    console.log(scripts);

    const res = await fetch("api/execute-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({scripts})
    });

    const data = await res.json();
    console.log(data.results);
    setExecutionUpdate(data.results);
  }

  return (
    <div
      className="wrapper flex"
      ref={reactFlowWrapper}
      style={{ width: "100%", height: "100vh", position: "relative" }}
    >
      <div className="w-4/5 h-full ">
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
          <Background />
        </ReactFlow>
      </div>
      <div className="overflow-y-auto w-1/5 h-full bg-gray-900 text-white p-4">
        <h1 className="font-bold text-lg">Execution Results</h1>
        {executionUpdate.length == 0 ? (
          <p className="text-black ">No results yet</p>
        ) : (
          executionUpdate.map((res, idx) => {
            return (
              <div key={idx} className="mb-4 border-b border-gray-700 pb-2">
                <p>
                  <strong>Step {idx + 1}</strong>
                </p>
                <p>Result: {res.result ?? "N/A"}</p>
                <p>Stdout: {res.stdout ?? "N/A"}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const Workflow =  () => (
  <ReactFlowProvider>
    <AddNodeOnEdgeDrop />
  </ReactFlowProvider>
);

export default Workflow;
