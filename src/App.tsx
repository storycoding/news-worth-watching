import VideoGallery from './components/VideoGallery'
import AzoresNewsDashboard from "./components/AzoresNewsDashboard";
import SourcesSection from "./components/SourcesSection";


export default function App() {

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-10">
        <AzoresNewsDashboard/>
      </section>

      <section className="mb-10">
        <VideoGallery />
      </section>

      <section className="mb-10">
        <SourcesSection />
      </section>

      <footer className="max-w-6xl mx-auto px-4 pb-10 text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} Served by Nuno Neves</p>
      </footer>
    </div>
  )
}