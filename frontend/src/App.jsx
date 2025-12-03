import FileUploader from "./components/FileUploader";
import Gallery from "./components/Gallery";

function app(){
  return (
    <div className="App">
      <h1>My File Upload App</h1>
      <FileUploader />
      <hr></hr>
      <Gallery />
    </div>
  )
}

export default app