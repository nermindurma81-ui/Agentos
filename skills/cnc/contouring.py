#!/usr/bin/env python3
import json,sys

if __name__ == "__main__":
    payload={"skill":"contouring","category":"cnc","args":sys.argv[1:]}
    print(json.dumps(payload))
