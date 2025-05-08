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
  text: string;
  isFirst: boolean;
  result?: string;
  stdout?: string;
};
function TextNode({ id, data }: NodeProps<Node<TextNodeType>>) {
  const { updateNodeData } = useReactFlow();
  const { isFirst, result, stdout } = data;

  return (
    <div className="p-2 bg-white rounded shadow-md">
      <div className="text-black font-bold">Node {id}</div>
      <textarea
        rows={5}
        onChange={(evt) => updateNodeData(id, { text: evt.target.value })}
        value={data.text}
        className="xy-theme__input w-full mt-1"
        style={{ color: "black" }}
      />
      {result && ( 
        <div className="mt-2 text-sm text-left text-gray-800">
          <p>
            <strong>Result:</strong> {result}
          </p>
          <p>
            <strong>Stdout:</strong> {stdout}
          </p>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
      {!isFirst && <Handle type="target" position={Position.Top} />}
    </div>
  );
}

export default memo(TextNode);
