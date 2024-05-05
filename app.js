const express = require("express"); //

const expressLayouts = require("express-ejs-layouts"); //untuk menggunakan template html yang berisi struktur umum

const { body, validationResult, check } = require("express-validator"); //digunakan untuk melakukan validasi data pada
//permintaan (request) yang masuk ke aplikasi Express.js.

const methodOverride = require("method-override"); //digunakan untuk menambahkan variasi metode HTTP

const session = require("express-session"); //untuk mengelola sesi pengguna

const cookieParser = require("cookie-parser"); //untuk mengurai cookie yang dikirimkan oleh klien dan menyimpannya
//dalam objek

const flash = require("connect-flash"); //untuk membuat flash messages yang ditampilkan ketika berhasil
//atau gagal membuat contact baru

require("./utils/db");
const Contact = require("./model/contact");
const Prodi = require("./model/prodi");
const Address = require("./model/address");

const app = express();
const port = 3000;

// Setup method override
app.use(methodOverride("_method"));
//SETUP ejs
//menggunakan ejs
app.set("view engine", "ejs");

//Third party middleware
app.use(expressLayouts);

//Built-in middleware 1
app.use(express.static("public"));

//Built-in middleware 2
app.use(express.urlencoded({ extended: true }));

//konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// =================================== ADD PROGRAM STUDY ========================
app.get("/program-study", async (req, res) => {
  try {
    const programStudi = await Prodi.find();
    res.render("programStudy", {
      layout: "layouts/main-layout",
      title: "Program Study",
      programStudi,
      msg: req.flash("msg"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/programStudy/add", (req, res) => {
  res.render("add-prodi", {
    title: "Form Tambah Data Program Studi",
    layout: "layouts/main-layout",
  });
});

//  ========== ADD Prodi =============
app.post(
  "/program-study",
  [
    body("namaProdi").custom(async (value) => {
      const duplikat = await Prodi.findOne({ namaProdi: value });
      if (duplikat) {
        throw new Error("Nama Program Study sudah digunakan!");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render("add-prodi", {
          title: "Form Tambah Data Program Study",
          layout: "layouts/main-layout",
          errors: errors.array(),
        });
      }

      await Prodi.create(req.body);
      req.flash("msg", "Data program study berhasil ditambahkan!");
      res.redirect("/program-study");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//  ========== Delete Prodi =============
app.delete("/program-study/:namaProdi", async (req, res) => {
  try {
    const deletedProdi = await Prodi.deleteOne({
      namaProdi: req.params.namaProdi,
    });
    if (deletedProdi.deletedCount === 0) {
      req.flash("msg", "Data Program Study tidak ditemukan!");
    } else {
      req.flash("msg", "Data Program Study berhasil dihapus!");
    }
    res.redirect("/program-study");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//  ========== Detail Prodi =============
app.get("/program-study/:namaProdi", async (req, res) => {
  //salah satu fitur tambahan dan menggunakan module tambahan
  const programStudi = await Prodi.findOne({ namaProdi: req.params.namaProdi });

  res.render("detail-prodi", {
    title: "Halaman Detail Program Study",
    layout: "layouts/main-layout",
    programStudi,
  });
});

// ========= Edit Prodi ================
app.get("/program-study/edit/:namaProdi", async (req, res) => {
  const programStudi = await Prodi.findOne({ namaProdi: req.params.namaProdi });

  res.render("edit-prodi", {
    title: "Form Ubah Data Program Study",
    layout: "layouts/main-layout",
    programStudi,
  });
});

// ============ Func Edit ================
app.put(
  "/program-study/:_id",
  [
    body("namaProdi").custom(async (value, { req }) => {
      const existingProdi = await Prodi.findOne({ namaProdi: value });
      if (existingProdi && existingProdi._id != req.params._id) {
        throw new Error("Nama program studi sudah digunakan!");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render("edit-prodi", {
          title: "Form Ubah Data Program Study",
          layout: "layouts/main-layout",
          errors: errors.array(),
          programStudi: req.body,
        });
      }

      const updatedProdi = await Prodi.findByIdAndUpdate(
        req.params._id,
        {
          $set: {
            namaProdi: req.body.namaProdi,
            fakultas: req.body.fakultas,
            akreditasi: req.body.akreditasi,
          },
        },
        { new: true }
      );

      if (!updatedProdi) {
        return res.status(404).send("Data program studi tidak ditemukan");
      }
      req.flash("msg", "Data program studi berhasil diubah!");
      res.redirect("/program-study");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// =================================== END PROGRAM STUDY ======================

// =================================== ADDRESS ===========================
app.get("/address", async (req, res) => {
  try {
    const address = await Address.find();
    res.render("address", {
      layout: "layouts/main-layout",
      title: "Address",
      address,
      msg: req.flash("msg"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/address/add", (req, res) => {
  res.render("add-address", {
    title: "Form Tambah Data Address",
    layout: "layouts/main-layout",
  });
});

//  ========== ADD Address =============
app.post(
  "/address",
  [
    check("kodePos")
      .isLength({ min: 5 })
      .withMessage("Kode Pos harus memiliki minimal 5 karakter"),
    check("noTelp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render("add-address", {
          title: "Form Tambah Data Address",
          layout: "layouts/main-layout",
          errors: errors.array(),
        });
      }

      await Address.create(req.body);
      req.flash("msg", "Data alamat berhasil ditambahkan!");
      res.redirect("/address");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// =================== DELETE ADDRESS ================
app.delete("/address/:_id", async (req, res) => {
  try {
    const address = await Address.deleteOne({
      _id: req.params._id,
    });
    if (address.deletedCount === 0) {
      req.flash("msg", "Data Address tidak ditemukan!");
    } else {
      req.flash("msg", "Data Address berhasil dihapus!");
    }
    res.redirect("/address");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//  ========== Detail ADDRESS =============
app.get("/address/:_id", async (req, res) => {
  const address = await Address.findOne({ _id: req.params._id });
  res.render("detail-address", {
    title: "Halaman Detail Address",
    layout: "layouts/main-layout",
    address,
  });
});

// ========= Edit ADDRESS ================
app.get("/address/edit/:_id", async (req, res) => {
  const address = await Address.findById({ _id: req.params._id });
  res.render("edit-address", {
    title: "Form Ubah Data Address",
    layout: "layouts/main-layout",
    address,
  });
});

// ============ Func Edit ================
app.put(
  "/address",
  [
    check("kodePos")
      .isLength({ min: 5 })
      .withMessage("Kode Pos harus memiliki minimal 5 karakter"),
    check("noTelp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("edit-address", {
        title: "Form Ubah Data Address",
        layout: "layouts/main-layout",
        errors: errors.array(),
        address: req.body,
      });
    } else {
      Address.updateOne(
        { _id: req.body._id },
        {
          $set: {
            kota: req.body.kota,
            jalan: req.body.jalan,
            rt: req.body.rt,
            rw: req.body.rw,
            kodePos: req.body.kodePos,
            noTelp: req.body.noTelp,
          },
        }
      ).then((result) => {
        //kirimkan flash message
        req.flash("msg", "Data Address berhasil diubah!");
        res.redirect("/address");
      });
    }
  }
);
// =================================== END ADD ADDRESS ===========================

//halaman home
app.get("/", (req, res) => {
  const mahasiswa = [
    {
      nama: "Ruben Setiaji",
      nim: "535220033",
      email: "ruben@untar.ac.id",
    },
    {
      nama: "Benny Dwiyanto",
      nim: "535220012",
      email: "benny@untar.ac.id",
    },
    {
      nama: "Raka Naufal",
      nim: "535220006",
      email: "raka@untar.ac.id",
    },
  ];
  res.render("index", {
    nama: "Ruben Setiaji",
    title: "Halaman Home",
    mahasiswa,
    layout: "layouts/main-layout",
  });
  console.log("ini halaman home");
});

//Halaman About
app.get("/about", (req, res, next) => {
  res.render("about", {
    layout: "layouts/main-layout",
    title: "Halaman About",
  });
});

//Halaman Contact
app.get("/contact", async (req, res) => {
  // Contact.find().then((contact) => {
  //     res.send(contact);
  // });
  const contacts = await Contact.find();

  res.render("contact", {
    layout: "layouts/main-layout",
    title: "Halaman Contact",
    contacts,
    msg: req.flash("msg"),
  });
});

//halaman form tambah data contact dengan RestAPI
app.get("/contact/add", (req, res) => {
  //menggunakan module tambahan dan untuk membuat fitur CRUD
  res.render("add-contact", {
    title: "Form Tambah Data Contact",
    layout: "layouts/main-layout",
  });
});

//proses data contact duplikat dengan RestAPI
app.post(
  "/contact",
  [
    //menggunakan module tambahan
    body("nama").custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (duplikat) {
        throw new Error("Nama contact sudah digunakan!");
      }
      return true;
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nohp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Form Tambah Data Contact",
        layout: "layouts/main-layout",
        errors: errors.array(),
      });
    } else {
      await Contact.insertMany(req.body);
      //kirimkan flash message
      req.flash("msg", "Data contact berhasil ditambahkan!");
      res.redirect("/contact");
    }
  }
);

// //proses delete contact
app.delete("/contact", (req, res) => {
  //untuk membuat fitur Delete
  Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    req.flash("msg", "Data contact berhasil dihapus!");
    res.redirect("/contact");
  });
});

//form ubah data contact //menggunakan module tambahan
app.get("/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });

  res.render("edit-contact", {
    title: "Form Ubah Data Contact",
    layout: "layouts/main-layout",
    contact,
  });
});

//proses ubah data
app.put(
  "/contact",
  [
    //menggunakan module tambahan dan membuat fitur Update data
    body("nama").custom(async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (value !== req.body.oldNama && duplikat) {
        throw new Error("Nama contact sudah digunakan!");
      }
      return true;
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nohp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("edit-contact", {
        title: "Form Ubah Data Contact",
        layout: "layouts/main-layout",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            email: req.body.email,
            nohp: req.body.nohp,
          },
        }
      ).then((result) => {
        //kirimkan flash message
        req.flash("msg", "Data contact berhasil diubah!");
        res.redirect("/contact");
      });
    }
  }
);

//halaman detail contact
app.get("/contact/:nama", async (req, res) => {
  //salah satu fitur tambahan dan menggunakan module tambahan
  const contact = await Contact.findOne({ nama: req.params.nama });

  res.render("detail", {
    title: "Halaman Detail Contact",
    layout: "layouts/main-layout",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});
