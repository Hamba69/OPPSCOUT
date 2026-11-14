import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback-form";
export const metadata:Metadata={title:"Share feedback"};
export default function FeedbackPage():React.JSX.Element{return <main className="animate-in flex flex-col gap-6"><header className="title-card"><h1>Share feedback</h1></header><FeedbackForm/></main>;}
