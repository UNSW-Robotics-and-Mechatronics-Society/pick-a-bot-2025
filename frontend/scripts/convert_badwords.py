import argparse
import json


def convert_txt_to_json(txt_path: str, json_path: str):
    """
    Reads a newline-separated text file of words and writes them as a JSON array.
    Blank lines are ignored.
    """
    with open(txt_path, "r", encoding="utf-8") as f:
        words = [line.strip() for line in f if line.strip()]
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)
    print(f"Converted {len(words)} words from {txt_path} to {json_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert a text file of bad words to JSON.")
    parser.add_argument("txt_path", help="Path to the input .txt file")
    parser.add_argument("json_path", help="Path for the output .json file")
    args = parser.parse_args()
    convert_txt_to_json(args.txt_path, args.json_path)
