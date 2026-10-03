import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback-form";
export const metadata:Metadata={title:"Share feedback"};
export default function FeedbackPage():React.JSX.Element{return <main className="page-shell mx-auto max-w-3xl"><h1 className="text-3xl font-extrabold text-ink">Share feedback</h1><p className="mt-3 text-navy">Tell us how to make OppScout better. Share an idea, a problem, or how it felt to use.</p><FeedbackForm/></main>;}
