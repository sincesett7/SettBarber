import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# --- CONFIGURAÇÃO POR ID ---
TOKEN = os.getenv("TOKEN")

# Cole o ID do cargo que terá acesso aos tickets.
ADMIN_ROLE_ID = 1373541464587374682 

# Cole o ID do canal onde a mensagem de "abrir ticket" será enviada.
SETUP_CHANNEL_ID = 1415435182101495828 

# Cole o ID da categoria onde os canais de ticket serão criados.
TICKET_CATEGORY_ID = 1370876996480925716
# --- FIM DA CONFIGURAÇÃO ---

# Validação inicial
if not TOKEN:
    print("ERRO CRÍTICO: O token do bot não foi encontrado na variável de ambiente 'TOKEN'.")
    exit()

# Define as "Intents" (intenções) do bot.
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

# Cria a instância do bot
bot = commands.Bot(command_prefix="!", intents=intents)

# Classe que define a View com o botão de criar ticket
class TicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Abrir Ticket", style=discord.ButtonStyle.primary, emoji="🎟️", custom_id="create_ticket_button_farm")
    async def create_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Estou criando seu canal privado...", ephemeral=True)

        guild = interaction.guild
        user = interaction.user

        admin_role = guild.get_role(ADMIN_ROLE_ID)
        category = guild.get_channel(TICKET_CATEGORY_ID)

        if not admin_role:
            await interaction.followup.send(f"Erro de configuração: O cargo com ID `{ADMIN_ROLE_ID}` não foi encontrado. Avise um administrador.", ephemeral=True)
            return
        if not category or not isinstance(category, discord.CategoryChannel):
            await interaction.followup.send(f"Erro de configuração: A categoria com ID `{TICKET_CATEGORY_ID}` não foi encontrada ou não é uma categoria. Avise um administrador.", ephemeral=True)
            return

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
            user: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
            admin_role: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
        }

        channel_name = f"ticket-{user.name}"
        
        for channel_check in category.text_channels:
            if channel_check.topic == f"ticket_owner:{user.id}":
                await interaction.followup.send(f"Você já possui um ticket aberto em {channel_check.mention}!", ephemeral=True)
                return

        try:
            new_channel = await guild.create_text_channel(
                name=channel_name,
                overwrites=overwrites,
                category=category,
                topic=f"ticket_owner:{user.id}"
            )
        except discord.Forbidden:
            await interaction.followup.send("Erro: O bot não tem permissão para criar canais nesta categoria. Verifique as permissões.", ephemeral=True)
            return

        welcome_embed = discord.Embed(
            title=f"Ticket de {user.name}",
            description=f"Bem-vindo, {user.mention}!\n\nUm membro da equipe ({admin_role.mention}) virá ajudá-lo em breve. Por favor, descreva seu problema detalhadamente.",
            color=discord.Color.green()
        )
        await new_channel.send(embed=welcome_embed)
        await interaction.followup.send(f"Seu ticket foi criado com sucesso! Acesse-o em {new_channel.mention}", ephemeral=True)

# <<< MUDANÇA PRINCIPAL AQUI >>>
# Evento que é acionado quando o bot está online e pronto
@bot.event
async def on_ready():
    print(f'Bot conectado como {bot.user}')
    # Adiciona a View (com o botão) de forma persistente.
    # Isso garante que o botão funcione mesmo se o bot for reiniciado.
    bot.add_view(TicketView())

    # Busca o canal de setup pelo ID
    channel = bot.get_channel(SETUP_CHANNEL_ID)
    if not channel:
        print(f"ERRO: O canal de setup com ID {SETUP_CHANNEL_ID} não foi encontrado.")
        return

    # Verifica se a mensagem já existe no canal
    message_found = False
    async for message in channel.history(limit=50): # Verifica as últimas 50 mensagens
        if message.author == bot.user and message.embeds:
            # Verifica se o embed é o nosso embed de ticket
            if message.embeds[0].title == "Suporte e Atendimento":
                print("Mensagem de setup já existe. Nenhuma ação necessária.")
                message_found = True
                break
    
    # Se, após verificar o histórico, a mensagem não foi encontrada, envia uma nova
    if not message_found:
        print("Mensagem de setup não encontrada. Enviando uma nova...")
        embed = discord.Embed(
            title="Suporte e Atendimento",
            description="Clique no botão abaixo para abrir um ticket e ser atendido por um administrador em um canal privado.",
            color=discord.Color.blue()
        )
        try:
            await channel.send(embed=embed, view=TicketView())
            print("Mensagem de setup enviada com sucesso.")
        except discord.Forbidden:
            print(f"ERRO: O bot não tem permissão para enviar mensagens no canal {channel.name} (ID: {SETUP_CHANNEL_ID}).")


# O comando !setup foi removido pois não é mais necessário.

# Inicia o bot
bot.run(TOKEN)