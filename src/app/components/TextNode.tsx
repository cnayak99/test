import { memo } from "react";
import {
  Position,
  Handle,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import "./xy-theme__input.css"
type TextNodeType = {
    text:string,
    isFirst: boolean
}
function TextNode({ id, data }: NodeProps<Node<TextNodeType>>) {
  const { updateNodeData } = useReactFlow();
  const { isFirst } = data;
  return (
    <div>
      <div className="text-black">node {id}</div>
      <div>
        <textarea
          rows={5}
          onChange={(evt) => updateNodeData(id, { text: evt.target.value })}
          value={data.text}
          className="xy-theme__input"
          style={{ color: "black" }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} />

      {!isFirst && <Handle type="target" position={Position.Top} />}
    </div>
  );
}

export default memo(TextNode);
