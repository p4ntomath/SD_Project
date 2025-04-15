export default function ChipComponent({ goal, onDelete }) {
    return (
      <li className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full py-1 px-3 mr-2 mb-2 text-sm">
        <p>{goal}</p>
        <button 
          type="button"
          onClick={onDelete}
          className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
          aria-label={`Remove ${goal}`}
          title="Remove goal"
        >
          &times;
        </button>
      </li>
    );
  }