import json
import urllib.request

LIST_ID = "901325044221"
TOKEN = "pk_112074279_SQZI5B4OLUS8UKTOPACFAGJGH6I9A5J3"

def create_task(name, description="", parent=None, status="to do"):
    url = f"https://api.clickup.com/api/v2/list/{LIST_ID}/task"
    data = {
        "name": name,
        "description": description,
        "status": status,
        "priority": 2
    }
    if parent:
        data["parent"] = parent
        
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method="POST")
    req.add_header("Authorization", TOKEN)
    req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"Error creating task {name}: {e}")
        return None

# 1. Create Main Task
main_task = create_task(
    "🚀 Projeto MetaAds - Plataforma de Anúncios", 
    "Desenvolvimento da plataforma com Supabase, Meta API e WhatsApp Automation.",
    status="em progresso"
)

if main_task:
    parent_id = main_task["id"]
    print(f"Main task created: {parent_id}")
    
    # 2. Create Subtasks
    subtasks = [
        ("✅ Identidade Visual (Verde & Preto)", "Rebranding completo da interface.", "finalizado"),
        ("✅ Configuração Supabase", "Persistência de dados e autenticação.", "finalizado"),
        ("✅ Páginas Legais (Compliance)", "Privacidade e Termos de Uso.", "finalizado"),
        ("⏳ Automação WhatsApp (Evolution API)", "Aguardando credenciais da instância.", "aberto"),
        ("⏳ Integração Meta API", "Aguardando Token de Usuário do Sistema.", "aberto"),
    ]
    
    for name, desc, status in subtasks:
        res = create_task(name, desc, parent=parent_id, status=status)
        if res:
            print(f"Subtask creation success: {name}")
else:
    print("Failed to create main task.")
