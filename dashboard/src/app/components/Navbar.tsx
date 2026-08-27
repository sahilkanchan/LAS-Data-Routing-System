import NavbarLeft from "./NavbarLeft";
import NavbarCenter from "./NavbarCenter";
import NavbarRight from "./NavbarRight";
import { getBatchSnippets } from "../actions/nav";

// const dummyBatches = [
//   {
//     benchmark: 0,
//     batchWordErrorRate: 0,
//     totalTime: 20011,
//     uuid: '1dc93748-5afb-4ffb-a31a-b4fd077e4ea9',
//     created_at: '01/21/25 00:00:00'
//   },
//   {
//     benchmark: 0,
//     batchWordErrorRate: 0,
//     totalTime: 20011,
//     uuid: '1dc93748-5afb-4ffb-a31a-b4fd077e4ea9',
//     created_at: '01/20/25 00:00:00'
//   }
// ]

const Navbar = async () => {
  const batches = await getBatchSnippets();

  return (
    <nav className="flex w-full items-center p-4">
      <div className="grid grid-cols-3 w-full">
        {/* Left nav home link. */}
        <NavbarLeft />

        {/* Center title. */}
        <NavbarCenter />

        {/* Right command options. */}
        <NavbarRight batches={batches}/>
      </div>
    </nav>
  );
}

export default Navbar;
