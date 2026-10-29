import "../design/Homepage.css";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

function Header() {
  return (
    <header className="page-header">
      <div className="page-title-wrap">
        <h1 className="page-title">
          <Logo />
        </h1>
      </div>
      <UserMenu />
    </header>
  );
}

export { Header };
