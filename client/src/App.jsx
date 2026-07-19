import {
  lazy,
  Suspense,
} from "react";

import {
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

const Home = lazy(() =>
  import("./pages/Home")
);

const Login = lazy(() =>
  import("./pages/Login")
);

const Register = lazy(() =>
  import("./pages/Register")
);

const MyTrips = lazy(() =>
  import("./pages/MyTrips")
);

const CreateTrip = lazy(() =>
  import("./pages/CreateTrip")
);

const TripDetails = lazy(() =>
  import("./pages/TripDetails")
);

const AddLocation = lazy(() =>
  import("./pages/AddLocation")
);

const LocationDetails = lazy(() =>
  import("./pages/LocationDetails")
);

const NotFound = lazy(() =>
  import("./pages/NotFound")
);

const PlaceholderPage = lazy(() =>
  import("./pages/PlaceholderPage")
);

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-spinner" />
      <span>Loading Pathly...</span>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <MyTrips />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips/new"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips/:tripId"
            element={
              <ProtectedRoute>
                <TripDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips/:tripId/locations/new"
            element={
              <ProtectedRoute>
                <AddLocation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/locations/:locationId"
            element={
              <ProtectedRoute>
                <LocationDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Interactive Map"
                  description="Trips and locations will soon appear here on the interactive map."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Your Profile"
                  description="Your profile, travel preferences and journey statistics will appear here."
                />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </Suspense>
  );
}

export default App;