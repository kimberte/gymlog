"use client";
import {usePathname} from "next/navigation";
import SiteHeader from "./SiteHeader";
export default function SiteBrandHeader(){const pathname=usePathname();if(!pathname||pathname==="/"||pathname==="/subscribe")return null;return <SiteHeader backHref="/" backLabel="Calendar"/>;}
