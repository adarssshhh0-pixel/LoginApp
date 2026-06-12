import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Dashboard      from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";
import EmployeeList   from "./pages/EmployeeList";
import CreateEmployee from "./pages/CreateEmployee";
import EditEmployee   from "./pages/EditEmployee";
import Departments    from "./pages/Departments";
import Skills         from "./pages/Skills";
import ApplyLeave     from "./pages/ApplyLeave";
import MyLeaves       from "./pages/MyLeaves";
import LeaveApproval  from "./pages/LeaveApproval";
import LeaveBalance   from "./pages/LeaveBalance";
import ManageRoles    from "./pages/ManageRoles";
import Notifications  from "./pages/Notifications";
import Assets         from "./pages/Assets";
import Reports        from "./pages/Reports";
import Profile        from "./pages/Profile";
import Attendance     from "./pages/Attendance";
import MyAttendance   from "./pages/MyAttendance";
import ProtectedRoute from "./routes/ProtectedRoute";
import Payroll   from "./pages/Payroll";
import MyPayroll from "./pages/MyPayroll";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/payroll" element={
        <ProtectedRoute roles={["admin","hr"]}>
            <Payroll />
        </ProtectedRoute>
        } />
        <Route path="/my-payroll" element={
        <ProtectedRoute><MyPayroll /></ProtectedRoute>
        } />

        {/* Public */}
        <Route path="/"                element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* All logged in users */}
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/apply-leave"   element={<ProtectedRoute><ApplyLeave /></ProtectedRoute>} />
        <Route path="/my-leaves"     element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
        <Route path="/leave-balance" element={<ProtectedRoute><LeaveBalance /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/assets"        element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/my-attendance" element={<ProtectedRoute><MyAttendance /></ProtectedRoute>} />

        {/* Manager, HR, Admin */}
        <Route path="/leave-approval" element={
          <ProtectedRoute roles={["manager","hr","admin"]}>
            <LeaveApproval />
          </ProtectedRoute>
        }/>
        <Route path="/attendance" element={
          <ProtectedRoute roles={["admin","hr","manager"]}>
            <Attendance />
          </ProtectedRoute>
        }/>

        {/* HR, Admin */}
        <Route path="/employees" element={
          <ProtectedRoute roles={["hr","admin"]}>
            <EmployeeList />
          </ProtectedRoute>
        }/>
        <Route path="/employees/create" element={
          <ProtectedRoute roles={["hr","admin"]}>
            <CreateEmployee />
          </ProtectedRoute>
        }/>
        <Route path="/employees/edit/:id" element={
          <ProtectedRoute roles={["hr","admin"]}>
            <EditEmployee />
          </ProtectedRoute>
        }/>
        <Route path="/reports" element={
          <ProtectedRoute roles={["hr","admin"]}>
            <Reports />
          </ProtectedRoute>
        }/>

        {/* Admin only */}
        <Route path="/departments" element={
          <ProtectedRoute roles={["admin"]}>
            <Departments />
          </ProtectedRoute>
        }/>
        <Route path="/skills" element={
          <ProtectedRoute roles={["admin"]}>
            <Skills />
          </ProtectedRoute>
        }/>
        <Route path="/manage-roles" element={
          <ProtectedRoute roles={["admin"]}>
            <ManageRoles />
          </ProtectedRoute>
        }/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;