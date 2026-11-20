"use client";
import Link from "next/link";
import AppDrawer from "./AppDrawer";
import "./AppDrawer.css";
export default function SiteHeader({backHref="/",backLabel="Calendar"}:{backHref?:string;backLabel?:string}){return <header className="top-bar gym-compact-header gym-shared-header"><Link href="/" className="gym-shared-logo" aria-label="Gym Log calendar"><img src="/gym-log-mark.svg" alt="Gym Log" width={40} height={40}/></Link><div className="gym-shared-actions"><Link className="gym-shared-back" href={backHref}>{backLabel}</Link><AppDrawer onSettings={()=>{window.location.href="/?settings=1"}}/></div></header>}