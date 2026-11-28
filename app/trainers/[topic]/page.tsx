import type {Metadata} from "next";import {notFound} from "next/navigation";import {TRAINER_TOPICS} from "../seoContent";import {TopicPage} from "../TrainerSeoPage";
export const dynamicParams=false;
export function generateStaticParams(){return TRAINER_TOPICS.map(t=>({topic:t.slug}));}
export async function generateMetadata({params}:{params:Promise<{topic:string}>}):Promise<Metadata>{const {topic}=await params;const t=TRAINER_TOPICS.find(x=>x.slug===topic);if(!t)return {};const url="/trainers/"+t.slug;return {title:t.title,description:t.desc,alternates:{canonical:url},openGraph:{title:t.title+" | Gym Log",description:t.desc,url,type:"website"},twitter:{card:"summary",title:t.title,description:t.desc}};}
export default async function Page({params}:{params:Promise<{topic:string}>}){const {topic}=await params;const t=TRAINER_TOPICS.find(x=>x.slug===topic);if(!t)notFound();return <TopicPage topic={t}/>;}
