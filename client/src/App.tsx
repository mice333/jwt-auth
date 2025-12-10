import { useContext, useEffect, useState, type FC } from "react";
import { LoginForm } from "./components/LoginForm";
import { Context } from "./main";
import { observer } from "mobx-react-lite";
import type { IUser } from "./models/IUser";
import UserService from "./services/UserService";

const App: FC = observer(() => {
  const { store } = useContext(Context);
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      store.checkAuth();
    }
  }, []);

  async function getUsers() {
    try {
      const response = await UserService.fetchUsers();
      setUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  if (store.isLoading) {
    return <div>Loading..</div>;
  }

  if (!store.isAuth) {
    return (
      <div>
        <LoginForm />
        <div>
          <button onClick={getUsers}>Users list</button>
        </div>
        {users.map((user) => (
          <div key={user.id}>{user.email}</div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1>
        {store.isAuth
          ? `Пользователь авторизован ${store.user.email}`
          : "АВТОРИЗУЙТЕСЬ"}
      </h1>
      <h1>
        {store.user.isActivated
          ? "Аккаунт подтвержден по почте"
          : "ПОДТВЕРДИ АККАУНТ"}
      </h1>
      <button onClick={() => store.logout()}>Logout</button>
      <div>
        <button onClick={getUsers}>Users list</button>
      </div>
      {users.map((user) => (
        <div key={user.id}>{user.email}</div>
      ))}
    </div>
  );
});

export default App;
