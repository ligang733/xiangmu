import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { KnowledgeBase } from "@/pages/KnowledgeBase";
import { UploadArticle } from "@/pages/UploadArticle";
import { Scraper } from "@/pages/Scraper";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scrape" element={<Scraper />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/knowledge/upload" element={<UploadArticle />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
