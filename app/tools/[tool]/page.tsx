import { ToolPage } from "../ToolsClient";
import { tools } from "../tools-data";
import { notFound } from "next/navigation";
export function generateStaticParams(){return tools.map(t=>({tool:t[0]}))}
export async function generateMetadata({params}:{params:Promise<{tool:string}>}){const {tool}=await params;const t=tools.find(x=>x[0]===tool);return {title:t?t[1]+" | Gym Log":"Gym Tool | Gym Log",description:t?t[2]:"Gym Log training tool"}}
export default async function Page({params}:{params:Promise<{tool:string}>}){const {tool}=await params;if(!tools.some(t=>t[0]===tool))notFound();return <ToolPage slug={tool}/>}
