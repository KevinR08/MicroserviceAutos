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

app.use(cors());

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
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(matchCars)
      } catch (error) {
        console.error('No se ha encontrado el auto', error)
        res.status(500).json({ error: 'No se ha encontrado el auto', errorFire: error })
      }
       
      
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

// Mostrar auto por ID
app.get('/api/read/car/:carId', async (req, res) => {
  try {
    const carId = req.params.carId; 
    const carsCol = doc(db, 'cars', carId)
    const carDoc = await getDoc(carsCol)
    if (carDoc.exists()) {
      const carData = {
        id: carDoc.id,
        ...carDoc.data()
      }
      res.status(200).json(carData)
    } else {
      res.status(404).json({ error: 'El auto no ha sido encontrado' })
    }
  } catch (error) {
    console.error('Error al mostrar auto', error)
    res.status(500).json({ error: 'Error al mostrar auto' })
  }
})


//Ruta para mostrar autos por usuario
  app.get('/api/read/car/auth/:userID', isAuthenticated, async (req, res) => {
    try {
      const userID = req.params.userID
      console.log(userID)
      const carsCol = collection(db, 'cars')
      const querySnapshot = await getDocs(query(carsCol, where('userID', '==', userID)))
      const carsList = []
      querySnapshot.forEach((doc) => {
        carsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      res.status(200).json(carsList)
    } catch (error) {
      console.error('Error al mostrar sus autos creados', error)
      res.status(500).json({ error: 'Error al mostrar sus autos creados' })
    }
  })

  // Ruta para eliminar un auto
app.delete('/api/delete/car/:idCar' , isAuthenticated, async (req, res) => {
    try {
      const idCar = req.params.idCar
      // Verifica si el libro existe antes de eliminarlo
      const carsCol = doc(db, 'cars', idCar)
      const carDoc = await getDoc(carsCol
  )
      if (!carDoc.exists()) {
        return res.status(404).json({ error: 'El auto no existe' })
      }
      await deleteDoc(carsCol
  )
      res.status(200).json({ message: 'Auto eliminado exitosamente' })
    } catch (error) {
      console.error('Error al eliminar el auto:', error)
      res.status(500).json({ error: 'Error al eliminar el auto', errorFire: error })
    }
  })

  //Crear un auto
app.post('/api/create/car', isAuthenticated, async (req, res) => {
    try {
      const carData = req.body
      console.log(carData)
      const newcarsCol = await addDoc(collection(db,'cars'), carData)
      res.status(201).json({ message: 'Auto creado exitosamente', idCar: newcarsCol.id })
    } catch (error) {
      // No se pudo crear el libro
      console.error('Error al crear el auto:', error)
      res.status(500).json({ error: 'Eror al crear el auto',errorFire:error })
    }
  })

  // Ruta para actualizar un auto
app.put('/api/update/car/:idCar', isAuthenticated, async (req, res) => {
    try {
      const idCar = req.params.idCar
      const updatedData = req.body
      // Verifica si el auto existe antes de actualizarlo
      const carsCol = doc(db, 'cars', idCar)
      const carDoc = await getDoc(carsCol)
      if (!carDoc.exists()) {
        return res.status(404).json({ error: 'El auto no existe' })
      }
      // Actualiza los datos del auto en la base de datos
      await updateDoc(carsCol, updatedData) 
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json({ message: 'Auto actualizado exitosamente' })
    } catch (error) {
      console.error('Error al actualizar el auto:', error)
      res.status(500).json({ error: 'Error al actualizar el auto', errorFire: error })
    }
  })

  app.post('/api/read/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file
      if (!file) {
        return res.status(400).send('No se ha proporcionado un archivo.');
      }
      const storageRef = ref(firebaseStorage, `/files/${file.originalname}`);
      const uploadTask = await uploadBytesResumable( storageRef, file.buffer );
      const downloadURL = await getDownloadURL(uploadTask.ref);
      console.log("downloadURL:", downloadURL);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send({url: downloadURL});
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al subir el archivo.');
    }
  });

  // Inicio del servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`)
})