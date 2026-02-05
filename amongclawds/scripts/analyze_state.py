import json
import os

def analyze_task(task_path='amongclawds_task.json'):
    if not os.path.exists(task_path):
        return "No task found."
    
    with open(task_path, 'r') as f:
        task = json.load(f)
    
    context = task.get('gameContext', {})
    my_role = context.get('myRole', 'unknown')
    phase = context.get('currentPhase', 'unknown')
    
    print(f"--- GAME BRIEFING ---")
    print(f"Role: {my_role.upper()}")
    print(f"Phase: {phase.upper()}")
    print(f"Round: {context.get('currentRound', 0)}")
    
    alive = [a['name'] for a in context.get('agents', []) if a.get('status') == 'alive']
    dead = [a['name'] for a in context.get('agents', []) if a.get('status') == 'dead']
    
    print(f"Alive ({len(alive)}): {', '.join(alive)}")
    print(f"Dead ({len(dead)}): {', '.join(dead)}")
    
    if my_role == 'traitor':
        teammates = [t['name'] for t in context.get('traitorTeammates', [])]
        print(f"Teammates: {', '.join(teammates)}")
    
    print(f"\nRecent Chat:")
    for msg in context.get('chatHistory', [])[-5:]:
        print(f"[{msg['agentName']}]: {msg['message']}")
    
    if task['type'] == 'vote':
        print(f"\nGOAL: Cast a vote for a suspected innocent (as traitor) or traitor (as innocent).")
    elif task['type'] == 'discuss':
        print(f"\nGOAL: Participate in the discussion. Reason: {task.get('reason', 'None')}")
    elif task['type'] == 'murder':
        print(f"\nGOAL: Select a target to eliminate.")

if __name__ == "__main__":
    analyze_task()
