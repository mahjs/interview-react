/*

  Explanation for Debouncing and Throttling in React Apps for this example:

  Both debouncing and throttling are techniques used to optimize performance in React applications, particularly when dealing with events that trigger frequent updates, such as user inputs.

  - Debouncing: Delays the execution of a function until after a certain period of time has elapsed since the last time the function was invoked. Useful for scenarios like delaying a search request until the user has finished typing.

  - Throttling: Limits the rate at which a function can be called, ensuring it's called at most once in a specified time interval. Useful for controlling the frequency of function invocations, such as scroll or resize events.

  Implementation in React:

  - Lodash provides utility functions like _.debounce() and _.throttle() for implementing debouncing and throttling in JavaScript applications.

  - Use useCallback() hook along with debouncing or throttling functions to create memoized event handlers in React components. These memoized handlers can then be passed to event listeners, ensuring efficient execution without causing performance issues.

  - Integrating debouncing and throttling techniques improves the responsiveness and performance of user interactions within React applications, preventing unnecessary resource consumption and providing a smoother user experience.
*/

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  createContext,
  useMemo,
  useContext,
  FC,
  Dispatch,
  SetStateAction,
  ChangeEvent,
} from "react";
import _ from "lodash";

interface SearchResultProps {
  containerClassName: string;
}
const SearchResults: FC<SearchResultProps> = ({ containerClassName }) => {
  const { filteredServices: results } = useSearchContext();
  return (
    <ul className={containerClassName}>
      {results.map(({ name }) => (
        <li
          key={name}
          className="border-b border-b-[#F5F5F5] p-3 cursor-pointer hover:bg-[#E5F1FF] list-none select-none"
        >
          {name}
        </li>
      ))}
    </ul>
  );
};

function FakeSpan() {
  const { serviceSearchInputValue: textValue, setFakeSpanDomWidth } =
    useSearchContext();
  const ref = useRef(null);

  const throttledSetFakeSpanDomWidth = useCallback(
    _.throttle((newWidth: string) => setFakeSpanDomWidth(newWidth), 120),
    [setFakeSpanDomWidth]
  );

  useEffect(() => {
    if (ref.current) {
      const newWidth = getComputedStyle(ref.current).width;
      throttledSetFakeSpanDomWidth(newWidth);
    }
  }, [textValue, throttledSetFakeSpanDomWidth]);
  return (
    <span ref={ref} className="invisible absolute whitespace-pre">
      {textValue}
    </span>
  );
}

function FeaturefulSearchInput() {
  const {
    serviceSearchInputValue,
    setServiceSearchInputValue,
    fakeSpanDomWidth,
    suggestionInputPlaceholder,
    setSuggestionInputPlaceholder,
    filteredServices,
  } = useSearchContext();

  const inputRef = useRef(null);

  const throttledSetServiceSearchInputValue = useCallback(
    _.throttle((value: string) => setServiceSearchInputValue(value), 120),
    [setServiceSearchInputValue]
  );

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e?.currentTarget?.value;
    throttledSetServiceSearchInputValue(value);
  };

  const firstSearchItemText = filteredServices[0]?.name || "";

  const isInputValueSubstrinOfFirstSearchItem =
    serviceSearchInputValue ===
    firstSearchItemText.substring(0, serviceSearchInputValue.length);

  const throttledSetSuggestionInputPlaceholder = useCallback(
    _.throttle(
      (newPlaceholder: string) => setSuggestionInputPlaceholder(newPlaceholder),
      500
    ),
    []
  );

  useEffect(() => {
    const newPlaceholder = isInputValueSubstrinOfFirstSearchItem
      ? firstSearchItemText
      : "";
    throttledSetSuggestionInputPlaceholder(newPlaceholder);
  }, [
    serviceSearchInputValue,
    filteredServices,
    firstSearchItemText,
    isInputValueSubstrinOfFirstSearchItem,
    throttledSetSuggestionInputPlaceholder,
  ]);

  const shouldInputExpand =
    fakeSpanDomWidth === "0px" || suggestionInputPlaceholder.length === 0;

  return (
    <div className="flex w-full">
      <div className="flex justify-between items-center w-full relative overflow-hidden">
        <input
          ref={inputRef}
          // @ts-ignore
          type_="search"
          className="absolute outline-none text-gray-700"
          style={{ width: shouldInputExpand ? "100%" : fakeSpanDomWidth }}
          value={serviceSearchInputValue}
          onChange={handleSearchInputChange}
          placeholder="به چه خدمتی نیاز دارید؟"
        />

        <FakeSpan />

        <input
          placeholder={suggestionInputPlaceholder}
          className="w-full outline-none"
        />
      </div>
    </div>
  );
}

export function ServiceSearch() {
  const {
    serviceSearchInputValue,
    services,
    setServices,
    setFilteredServices,
  } = useSearchContext();

  useEffect(() => {
    fetch("/api/services?zoneId=1").then((res) =>
      res.json().then((s) => setServices(s))
    );
  }, [setServices]);

  useEffect(() => {
    const results = services.filter((s) =>
      s.name.includes(serviceSearchInputValue)
    );

    if (serviceSearchInputValue.trim() !== "") {
      setFilteredServices(results);
    } else {
      setFilteredServices([]);
    }
  }, [serviceSearchInputValue, services, setFilteredServices]);

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 bg-white z-[99999] cursor-default">
      <div className="px-3 py-7 max-w-96 m-auto">
        <div className="relative flex items-center w-full shadow-sm rounded-md">
          <div className="flex flex-col justify-center w-full relative">
            <div className="flex items-center p-3 border-gray-200 border rounded-lg h-12">
              <FeaturefulSearchInput />
            </div>
            <span className="absolute left-0 self-center h-9 w-0 border-r-[1px] border-gray-200" />
          </div>
          <SearchResults containerClassName="bg-white overflow-auto z-10 mt-12 top-0 max-h-72 absolute w-full border border-[#EAECED] rounded-b-md shadow-sm scrollbar-minimal" />
        </div>
      </div>
    </div>
  );
}

interface Service {
  id: string;
  name: string;
}
interface ContextType {
  services: Service[];
  setServices: Dispatch<SetStateAction<Service[]>>;
  filteredServices: Service[];
  setFilteredServices: Dispatch<SetStateAction<Service[]>>;
  serviceSearchInputValue: string;
  setServiceSearchInputValue: Dispatch<SetStateAction<string>>;
  fakeSpanDomWidth: string;
  setFakeSpanDomWidth: Dispatch<SetStateAction<string>>;
  suggestionInputPlaceholder: string;
  setSuggestionInputPlaceholder: Dispatch<SetStateAction<string>>;
}

const SeachServiceContext = createContext<ContextType>({
  services: [],
  setServices: () => {},
  filteredServices: [],
  setFilteredServices: () => {},
  serviceSearchInputValue: "",
  setServiceSearchInputValue: () => {},
  fakeSpanDomWidth: "100%",
  setFakeSpanDomWidth: () => {},
  suggestionInputPlaceholder: "",
  setSuggestionInputPlaceholder: () => {},
});

export const useSearchContext = () => useContext(SeachServiceContext);

export default function SearchServiceProvider() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [serviceSearchInputValue, setServiceSearchInputValue] = useState("");
  const [fakeSpanDomWidth, setFakeSpanDomWidth] = useState("100%");
  const [suggestionInputPlaceholder, setSuggestionInputPlaceholder] =
    useState("");

  const contextValue = useMemo(
    () => ({
      services,
      setServices,
      filteredServices,
      setFilteredServices,
      serviceSearchInputValue,
      setServiceSearchInputValue,
      fakeSpanDomWidth,
      setFakeSpanDomWidth,
      suggestionInputPlaceholder,
      setSuggestionInputPlaceholder,
    }),
    [
      services,
      serviceSearchInputValue,
      filteredServices,
      fakeSpanDomWidth,
      suggestionInputPlaceholder,
    ]
  );
  return (
    <SeachServiceContext.Provider value={contextValue}>
      <ServiceSearch />
    </SeachServiceContext.Provider>
  );
}
