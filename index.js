//Entranamiendo de las api
const express = require('express');
const { json } = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, updateDoc, collection, query, limit, getDocs, where, getDoc, addDoc, doc, deleteDoc } = require('firebase/firestore');
const { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const multer = require('multer');
const { memoryStorage } = require('multer');
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require("firebase/storage");
const isAuthenticated =require('./firebaseAuthentication')
const firebaseConfig =require('./firebaseConfig')
require('dotenv').config()
const { v4 } = require('uuid');
const app = express()
app.use(express.json())

app.use(cors({ origin: 'http://localhost:5173' }));

// Conexión a Firebase
const appFirebase = initializeApp(firebaseConfig)
const auth = getAuth(appFirebase)
const db = getFirestore(appFirebase)
const firebaseStorage = getStorage(appFirebase)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

//Petición GET a API
app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`)
})

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params
  res.end(`Item: ${slug}`)
})


// Mostrar los autos
app.get('/api/read/cars', async (req, res) => {
    try {
      const carsCol = collection(db, 'cars')
      const carSnapshot = await getDocs(carsCol)
      const carsList = []
      carSnapshot.forEach((doc) => {
        carsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      res.status(200).json(carsList)
    } catch (error) {
      console.error('No se pudieron obtener los autos', error)
      res.status(500).json({ error: 'Error al cargar los autos' })
    }
  })


  //Mostrar autos por límite
app.get('/api/read/cars/:limit', async (req, res) => {
    try {
      const limitParam = parseInt(req.params.limit, 10) || 5 
      const carsCol = collection(db, 'cars')
      const querySnapshot = await getDocs(query(carsCol, limit(limitParam)))
      const carsList = []
      querySnapshot.forEach((doc) => {
        carsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      res.status(200).json(carsList)
    } catch (error) {
      console.error('Error al cargar listado de autos', error)
      res.status(500).json({ error: 'Error al cargar listado de autos' })
    }
  })


// Buscar autos por título
app.get('/api/search/cars', async (req, res) => {
    try {
      const searchText = req.query.brand.toLowerCase() 
      const carsCol = collection(db, 'cars')
      const querySnapshot = await getDocs(carsCol)
      const matchCars = []
      querySnapshot.forEach((doc) => {
        const title = doc.data().brand.toLowerCase()
        if (title.includes(searchText)) {
          // Agregar los autos que coinciden a la lista
          matchCars.push({ id: doc.id, ...doc.data() })
        }
      })
      res.status(200).json(matchCars)
    } catch (error) {
      console.error('No se ha encontrado el auto', error)
      res.status(500).json({ error: 'No se ha encontrado el auto', errorFire: error })
    }
  })

  



  // Inicio del servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`)
})