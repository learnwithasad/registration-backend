import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";
import Student from "../models/student.model.js";
import transporter from "../config/nodemailer.js";
import Admin from "../models/admin.model.js";
import mongoose from "mongoose";

console.log('SECRET:', process.env.SENDER_EMAIL, process.env.SECRET_URL_KEY);

const studentRegister = async (req, res) => {
  const {
    fullName,
    fatherName,
    address,
    email,
    phone,
    cnic,
    dateOfBirth,
    gender,
    qualification,
    coupon,
    password,
  } = req.body;

  try {
    let user = await Student.findOne({ email });
    if (user)
      return res
        .status(400)
        .json({ success: false, error: "Email already exists" });

    user = await Student.findOne({ phone });
    if (user)
      return res
        .status(400)
        .json({ success: false, error: "Phone number already exists" });

    user = await Student.findOne({ cnic });
    if (user)
      return res
        .status(400)
        .json({ success: false, error: "CNIC already exists" });

    let profilePicUrl = "";
    let paymentScreenshotUrl = "";

    if (req.files && req.files.profilePic) {
      const profilePicResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "student_profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.profilePic[0].buffer);
      });
      profilePicUrl = profilePicResult.secure_url;
    }

    if (req.files && req.files.paymentScreenshot) {
      const paymentScreenshotResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "payment_screenshots" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.paymentScreenshot[0].buffer);
      });
      paymentScreenshotUrl = paymentScreenshotResult.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const generateRollNo = Math.floor(1000 + Math.random() * 9000).toString();

    const student = new Student({
      rollNo: generateRollNo,
      fullName,
      fatherName,
      dateOfBirth,
      gender,
      qualification,
      address,
      phone,
      email,
      cnic,
      coupon,
      password: hashedPassword,
      profilePic: profilePicUrl,
      paymentScreenshot: paymentScreenshotUrl,
    });

    await student.save();

    //sending email
const mailOptions = {
  from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
  to: email,
 subject: "Registration Confirmed – MERN Stack Development Course",
  text: `
Dear ${fullName},

Thank you for registering for the MERN Stack Development course at Skills Sikhao.

We are pleased to confirm that we have received your application. Your details are currently under review and will be verified within 12 hours. Once the verification process is complete, you will receive a confirmation email with further instructions.

If you have any questions or need assistance, feel free to contact us at ${process.env.SENDER_EMAIL}.

Thank you for choosing Skills Sikhao to enhance your development skills. We look forward to supporting you on your learning journey.

Best regards,  
The Skills Sikhao Team
  `,
};

    const alertEmail = {
      from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
      to: "asad.digitalwork@gmail.com",
      subject: "New Student Registration Alert - MERN Stack Development",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">New Student Registration</h1>
      </div>
      <div style="padding: 20px;">
        <p style="font-size: 16px;">A new student has registered with the following details:</p>
        <ul style="list-style: none; padding: 0; font-size: 14px;">
        <li><strong>Roll No:</strong> ${generateRollNo}</li>
        <li><strong>Full Name:</strong> ${fullName}</li>
        <li><strong>Father Name:</strong> ${fatherName}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Email:</strong> ${password} Temp123</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>CNIC:</strong> ${cnic}</li>
        <li><strong>Email:</strong> ${coupon}</li>
    <li><strong>Address:</strong> ${address}</li>

    </ul>
    <img src="${profilePicUrl}" alt="Profile Picture" style="width: 200px; height: auto;" />
    <img src="${paymentScreenshotUrl}" alt="Payment Screenshot" style="width: 200px; height: auto;" />
  <p><strong>Note:</strong> This is an automated email. Please do not reply.</p>
  <p>Please verify the student's details and take necessary actions.</p>
  <p>Thank you!</p>
  <p>Best regards,</p>
  <p>Skills Sikhao Team</p>
    `,
    };

    await transporter.sendMail(mailOptions);

    await transporter.sendMail(alertEmail);

    res.json({
      success: true,
      message:
        "Form submitted successfully. Your details are under review and will be verified within 12 hours.",
      id: student._id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Admin

const adminRegister = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    const admin = await Admin.findOne({ email });

    if (admin) {
      return res
        .status(400)
        .json({ success: false, error: "Admin already exists" });
    }

    const generateOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      otp: generateOtp,
    });
    await newAdmin.save();

    const mailOptions = {
      from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
      to: "asad.digitalwork@gmail.com",
      subject: "Verify New Admin",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">New Admin Registration</h1>
      </div>
      <div style="padding: 20px;">
        <p style="font-size: 16px;">A new Admin has registered with the following details:</p>
        <ul style="list-style: none; padding: 0; font-size: 14px;">
        <li><strong>Full Name:</strong> ${fullName}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Email:</strong> ${password} Temp123</li>
        <li><strong>OTP:</strong> ${generateOtp}</li>
    </ul>
  <p><strong>Note:</strong> This is an automated email. Please do not reply.</p>
  <p>Please verify the Admin's details and take necessary actions.</p>
  <p>Thank you!</p>
  <p>Best regards,</p>
  <p>Skills Sikhao Team</p>
    `,
    };

    await transporter.sendMail(mailOptions);

    const mailForAdmin = {
      from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Registration Confirmation - Skills Sikhao",
      text: `
      Dear ${fullName},

      Thank you for registering as an Admin at Skills Sikhao.

      Please wait for the verification process to be completed. The Skills Sikhao team will soon provide you with a verification code to access the Admin panel.

      If you have any questions or need assistance, feel free to contact us at ${process.env.SENDER_EMAIL}.

      Best regards,
      Skills Sikhao Team
      `,
    };

    await transporter.sendMail(mailForAdmin);

    const urlId = newAdmin._id.toString();

    res.status(200).json({
      success: true,
      message: "Admin form submitted successfully Please wait for verification",
      id: urlId,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const { otp, id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid request please don't try to access",
        });
    }

    const originalId = id;

    if (!originalId) {
      return res.status(400).json({
        success: false,
        error: "Invalid request please try again or contact support",
      });
    }
    if (!otp) {
      return res.status(400).json({ success: false, error: "OTP is required" });
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    if (admin.adminVerified) {
      return res
        .status(400)
        .json({ success: false, error: "Already verified account" });
    }

    if (admin.otp !== otp) {
      return res.status(400).json({ success: false, error: "Invalid OTP" });
    }

    admin.adminVerified = true;

    await admin.save();
    const mailOptions = {
      from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
      to: admin.email,
      subject: "Admin Registration Successful",
      text: `
  Dear ${admin.fullName},

  Your Admin registration is successful. You can now login to your account.

  If you have any questions or need assistance, feel free to contact us at ${process.env.SENDER_EMAIL}.

  Thank you for choosing Skills Sikhao. We look forward to supporting you on your journey.

  Best regards,
  Skills Sikhao Team
      `,
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Admin verified successfully",
      id: id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const { id } = req.body;

    const originalId = id;

    if (!originalId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid request please try again" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid request please don't try to access",
        });
    }

    const admin = await Admin.findById(id);
    if (!admin || !admin.adminVerified) {
      return res.status(404).json({ success: false, error: "unauthorized" });
    }

    const students = await Student.find().select("-password -updatedAt");
    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No students found" });
    }

    res.json(students);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email or password" });
    }
    if (!admin.adminVerified) {
      return res
        .status(400)
        .json({ success: false, error: "Admin not verified" });
    }

    const id = admin._id.toString();
    res.status(200).json({ success: true, message: "Login successfully", id });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const verifyStudent = async (req, res) => {
  try {
    const { id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid request please don't try to access",
        });
    }

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "please try again" });
    }

    const student = await Student.findById(id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }
    if (student.profileVerified) {
      return res
        .status(400)
        .json({ success: false, error: "Already verified student" });
    }

    student.profileVerified = true;
    await student.save();
    
    if (student.coupon.trim().toLowerCase() === "fatima" || student.coupon.trim().toLowerCase() === "asad", student.coupon.trim().toLowerCase() === "azan" || student.coupon.trim().toLowerCase() === "skillssikhao", student.coupon.trim().toLowerCase() === "getfree") {
      const mailOptions = {
  from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
  to: student.email,
  subject: "Verification Successful – Welcome to Skills Sikhao!",
  text: `
Dear ${student.fullName},

Congratulations! Your profile has been successfully verified, and you are now officially enrolled in the MERN Stack Development course at Skills Sikhao.

🎁 As a bonus, because you applied the coupon code ${student.coupon}, you have also received free access to our Frontend Development course — a perfect companion to boost your MERN journey!

To begin learning, please log in to your student dashboard using the same email and password you used during registration:
🔗 https://skillssikhao.com/dashboard/

Inside your dashboard, you will find everything you need:
- Video Classes  
- Multiple Choice Questions (MCQs)  
- Assignments  
- Question & Answer Forum  

You’ll be added to the official WhatsApp group shortly, where you’ll receive updates, announcements, and important learning resources.

If you have any questions or need help, feel free to contact us at ${process.env.SENDER_EMAIL}.

Thank you for choosing Skills Sikhao. We’re excited to have you on board and look forward to supporting your growth!

Best regards,  
Skills Sikhao Team
  `,
};

await transporter.sendMail(mailOptions);
    } else {

const mailOptions = {
  from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
  to: student.email,
  subject: "Verification Successful – Welcome to the MERN Stack Development Course",
  text: `
Dear ${student.fullName},

We are pleased to inform you that your profile has been successfully verified. You are now officially enrolled in the MERN Stack Development course at Skills Sikhao.

To continue your learning journey, please log in to your dashboard using the same email and password you provided during registration:
https://skillssikhao.com/dashboard/

Inside your dashboard, you will find everything you need:
- Video Classes
- Multiple Choice Questions (MCQs)
- Assignments
- Question & Answer Forum

You will be added to the official WhatsApp group soon, where we will share class updates, announcements, and important resources.

If you have any questions or need assistance, feel free to contact us at ${process.env.SENDER_EMAIL}.

Thank you for choosing Skills Sikhao. We look forward to supporting you throughout your learning journey.

Best regards,  
Skills Sikhao Team
  `,
};

await transporter.sendMail(mailOptions);

}
    

    res.status(200).json({
      success: true,
      message: "Student verified successfully",
      id: id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const rejectStudent = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found" });
    }

    // Send email logic here...
    const mailOptions = {
  from: `"Skills Sikhao" <${process.env.SENDER_EMAIL}>`,
  to: student.email,
  subject: "Registration Unsuccessful – Skills Sikhao",
  text: `
Dear ${student.fullName},

Thank you for your interest in the MERN Stack Development course at Skills Sikhao.

After reviewing your registration, we regret to inform you that we could not verify your profile at this time. As a result, your enrollment request has not been approved.

If you believe this was a mistake or if you have any questions, please feel free to contact us at ${process.env.SENDER_EMAIL}. We're happy to assist you.

We appreciate your understanding and hope to hear from you soon.

Best regards,  
Skills Sikhao Team
  `,
};

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// Generate ID card for student

const downloadIdCard = async (req, res) => {
  try {
    const { cnic } = req.body;
    if (!cnic) {
      return res
        .status(400)
        .json({ success: false, error: "CNIC is required" });
    }

    const student = await Student.findOne({ cnic });
    if (!student) {
      return res
        .status(404)
        .json({
          success: false,
          error: "Please try again and enter correct CNIC",
        });
    }

    const timer = student.createdAt.getTime() + 12 * 60 * 60 * 1000; // 12 hours in milliseconds

    const currentTime = new Date().getTime();

    if (!student.profileVerified) {
      if (currentTime < timer) {
        return res.status(400).json({
          success: false,
          error: "Please wait for verification before downloading the ID card",
        });
      }

      if (currentTime > timer) {
        return res.status(400).json({
          success: false,
          error:
            "You're not allowed to download ID card please contact support",
        });
      }
    }

    res.status(200).json({
      rollNo: student.rollNo,
      name: student.fullName,
      fatherName: student.fatherName,
      cnic: student.cnic,
      img: student.profilePic,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export {
  studentRegister,
  adminRegister,
  verifyAdmin,
  loginAdmin,
  getAllStudents,
  verifyStudent,
  rejectStudent,
  downloadIdCard,
};
