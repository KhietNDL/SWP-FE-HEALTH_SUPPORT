import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/home";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register/register";
import "./main.css"
import Info from "./pages/info-user";
import Booking from "./pages/Booking";
import BookingDetail from "./pages/Booking-detail";
import Blog from "./pages/Blog/Blog";
import BlogDetail from "./pages/BlogDetail/BlogDetail";
import Document from "./pages/Document/Document";
import DocumentDetail from "./pages/DocumentDetail/DocumentDetail";
import "./main.css"

function MG() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <HomePage/>
    },
    {
      path: "/info-user",
      element: <Info/>
    },
    {
      path: "/login",
      element: <LoginPage/>
    },
    {
      path: "/register",
      element: <RegisterPage/>
    },
    {
      path: "/booking",
      element: <Booking/>
    },
    {
      path: "/booking-detail/:id",
      element: <BookingDetail/>
    },
    {

      path: "/blog",
      element: <Blog/>
    },
    {
      path: "/blog/:id",
      element: <BlogDetail/>
    },
    {
      path: "/tai-lieu",
      element: <Document/>
    },
    {
      path: "/tai-lieu/:id",
      element: <DocumentDetail/>
    }
  ]);
  return (
    <RouterProvider router={router} />
  )
}

export default MG
