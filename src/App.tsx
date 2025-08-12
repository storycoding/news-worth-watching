// import VideoGallery from './components/VideoGallery'
import AzoresNewsDashboard from "./components/AzoresNewsDashboard";


export default function App() {

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-10">
        {/* <VideoGallery /> */}
        <AzoresNewsDashboard/>
      </section>

      <footer className="mt-16 border-t pt-6 text-xs opacity-60">
        <p>© {new Date().getFullYear()} Served by Nuno Neves</p>
      </footer>
    </div>
  )
}