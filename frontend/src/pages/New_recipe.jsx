import { useState } from "react";

function AddRecipe() {
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    image: null 
  });
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");

  const handleChange = (e) => {
    if (e.target.name === "image") {
      const file = e.target.files[0];
      setForm({ ...form, image: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));
    const author = user?.username || "anonim";

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("author", author);
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setForm({ title: "", description: "", image: null });
        setPreview("");
        document.getElementById("image-upload").value = ""; 
      } else {
        setMessage(data.message || "Wystąpił błąd podczas dodawania przepisu");
      }
    } catch (error) {
      setMessage("Błąd połączenia z serwerem.");
      console.error("Error:", error);
    }
  };

  return (
    <main>
      <h1>Dodaj przepis</h1>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input 
          name="title" 
          placeholder="Tytuł" 
          value={form.title}
          onChange={handleChange} 
          required 
        />
        <br />
        <textarea 
          name="description" 
          placeholder="Opis" 
          value={form.description}
          onChange={handleChange} 
          required 
        />
        <br />
        <input
          id="image-upload"
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          required
        />
        {preview && (
          <div>
            <img 
              src={preview} 
              alt="Podgląd zdjęcia" 
              style={{ maxWidth: "200px", maxHeight: "200px" }} 
            />
          </div>
        )}
        <br />
        <button type="submit">Dodaj</button>
      </form>
    </main>
  );
}

export default AddRecipe;