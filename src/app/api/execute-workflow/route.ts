import { NextRequest, NextResponse } from "next/server";
export async function POST(req:NextRequest) {
    const body = await req.json();
    const scripts = body.scripts as string[];
    const results=[];
    try {
        for(const script of scripts){
            const res = await fetch("http://34.72.72.150:8080/execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ script }),
            });
            const result = await res.json();
            results.push(result);
        }
    } catch (error) {
        results.push({error:String(error)});
    }
    return NextResponse.json({results});
}
