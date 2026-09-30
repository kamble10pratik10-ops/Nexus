import subprocess
import re
import numpy as np

seeds = [42, 100, 256, 512, 1024]
precisions = []
recalls = []
f1_scores = []

for seed in seeds:
    print(f"\n--- Running Benchmark for Seed {seed} ---")
    # Generate data with seed
    subprocess.run(["python", "generate_mock_data.py", str(seed)], check=True)
    
    # Run benchmark harness
    result = subprocess.run(["python", "benchmark_harness.py"], capture_output=True, text=True)
    output = result.stdout
    
    # Parse metrics from output
    precision_match = re.search(r'- \*\*Precision:\*\* ([\d\.]+)%', output)
    recall_match = re.search(r'- \*\*Recall:\*\* ([\d\.]+)%', output)
    f1_match = re.search(r'- \*\*F1 Score:\*\* ([\d\.]+)%', output)
    
    if precision_match and recall_match and f1_match:
        p = float(precision_match.group(1))
        r = float(recall_match.group(1))
        f1 = float(f1_match.group(1))
        
        precisions.append(p)
        recalls.append(r)
        f1_scores.append(f1)
        
        print(f"Seed {seed}: Precision={p}%, Recall={r}%, F1={f1}%")
    else:
        print(f"Failed to parse output for seed {seed}")
        print(output)

print("\n=========================================")
print("MULTI-SEED VALIDATION RESULTS (N=5)")
print("=========================================")
print(f"Precision: {np.mean(precisions):.2f}% ± {np.std(precisions):.2f}%")
print(f"Recall:    {np.mean(recalls):.2f}% ± {np.std(recalls):.2f}%")
print(f"F1 Score:  {np.mean(f1_scores):.2f}% ± {np.std(f1_scores):.2f}%")
print("=========================================")
