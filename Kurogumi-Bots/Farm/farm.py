import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
from datetime import datetime
import gspread

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# --- CONFIGURAÇÃO ---
TOKEN = os.getenv("TOKEN")

ADMIN_ROLE_ID = 1373541464587374682 
SETUP_CHANNEL_ID = 1415435182101495828 
TICKET_CATEGORY_ID = 1370876996480925716

GOOGLE_SHEET_NAME = "Kurogumi" 
LOG_SHEET_NAME = "LOGS FARM"
TOTAL_SHEET_NAME = "TOTAL FARM"

KUROGUMI_COLOR = 0xE1007E
KUROGUMI_LOGO_URL = "https://i.imgur.com/KqWJq8E.png"
ITEM_VALUE_PER_UNIT = 2
BOT_FOOTER_TEXT = "Desenvolvido por SettLabs / By Since"
# --- FIM DA CONFIGURAÇÃO ---

try:
    gc = gspread.service_account(filename='credentials.json')
    sh = gc.open(GOOGLE_SHEET_NAME)
    
    try:
        log_worksheet = sh.worksheet(LOG_SHEET_NAME)
    except gspread.WorksheetNotFound:
        log_worksheet = sh.add_worksheet(title=LOG_SHEET_NAME, rows="1000", cols="20")
        
    try:
        total_worksheet = sh.worksheet(TOTAL_SHEET_NAME)
    except gspread.WorksheetNotFound:
        total_worksheet = sh.add_worksheet(title=TOTAL_SHEET_NAME, rows="1000", cols="20")

    print(f"Conectado à Planilha Google '{GOOGLE_SHEET_NAME}' e às abas '{LOG_SHEET_NAME}' e '{TOTAL_SHEET_NAME}' com sucesso!")
except Exception as e:
    print(f"Ocorreu um erro crítico ao conectar com a planilha: {e}")
    exit()

if not TOKEN:
    print("ERRO CRÍTICO: O token do bot não foi encontrado.")
    exit()

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

class FarmModal(discord.ui.Modal, title="Registro de Farm Kurogumi"):
    quantity = discord.ui.TextInput(
        label="Quantidade de Itens",
        placeholder="Digite a quantidade de itens do seu farm. Ex: 1500",
        required=True,
        style=discord.TextStyle.short,
    )

    async def on_submit(self, interaction: discord.Interaction):
        quantity_str = self.quantity.value
        try:
            amount = int(quantity_str)
            if amount <= 0:
                 await interaction.response.send_message("❌ Erro! A quantidade de itens deve ser um número positivo.", ephemeral=True)
                 return
        except ValueError:
            await interaction.response.send_message("❌ Erro! Você deve digitar apenas números.", ephemeral=True)
            return

        guild = interaction.guild
        category = guild.get_channel(TICKET_CATEGORY_ID)
        user_farm_channel = None
        if category:
            for channel in category.text_channels:
                if channel.topic == f"farm_owner:{interaction.user.id}":
                    user_farm_channel = channel
                    break
        
        if not user_farm_channel:
            await interaction.response.send_message("❌ Erro! Não encontrei sua **Sala de Farm**. Use o botão 'Criar Sala de Farm' primeiro.", ephemeral=True)
            return

        try:
            user_id_str = str(interaction.user.id)
            cell = total_worksheet.find(user_id_str, in_column=1)

            if not cell:
                await interaction.response.send_message("❌ Erro! Seu registro não foi encontrado na planilha. Tente criar uma nova Sala de Farm.", ephemeral=True)
                return

            # <<< CORREÇÃO AQUI >>>
            # 1. Lemos o valor da célula como um texto (string).
            current_total_str = total_worksheet.cell(cell.row, 3).value
            # 2. Removemos todos os pontos ('.') do texto. Ex: '2.000' vira '2000'.
            cleaned_total_str = current_total_str.replace('.', '')
            # 3. Agora convertemos o texto limpo para um número inteiro.
            current_total = int(cleaned_total_str)
            
            new_total_items = current_total + amount
            total_value_to_receive = new_total_items * ITEM_VALUE_PER_UNIT

            total_worksheet.update_cell(cell.row, 3, new_total_items)
            total_worksheet.update_cell(cell.row, 4, total_value_to_receive)
            
            log_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_row = [log_date, str(user_farm_channel.id), interaction.user.display_name, amount]
            log_worksheet.append_row(log_row)
            
            print(f"SALVO EM LOGS: {log_row}")
            print(f"ATUALIZADO EM TOTAIS: ID {user_id_str} para {new_total_items} itens.")

        except Exception as e:
            print(f"ERRO AO INTERAGIR COM A PLANILHA: {e}")
            await interaction.response.send_message("❌ Ocorreu um erro ao salvar seu registro na planilha. Contate um administrador Kurogumi.", ephemeral=True)
            return

        extrato_embed = discord.Embed(
            title="📈 Extrato de Farm Kurogumi",
            description=f"Registro de farm por {interaction.user.mention} concluído!",
            color=KUROGUMI_COLOR,
        )
        extrato_embed.add_field(name="📦 Entrega Atual", value=f"`{amount:,}` itens".replace(",", "."), inline=True)
        extrato_embed.add_field(name="🧰 Total Acumulado", value=f"`{new_total_items:,}` itens".replace(",", "."), inline=True)
        extrato_embed.add_field(name="💰 Valor Total a Receber", value=f"**`${total_value_to_receive:,}`**".replace(",", "."), inline=False)
        
        timestamp_formatado = f"<t:{int(datetime.now().timestamp())}:F>"
        extrato_embed.add_field(
            name="Detalhes do Registro",
            value=f"**ID do Membro:** `{interaction.user.id}`\n**Registrado em:** {timestamp_formatado}",
            inline=False
        )

        extrato_embed.set_footer(text=BOT_FOOTER_TEXT)
        extrato_embed.set_thumbnail(url=KUROGUMI_LOGO_URL)

        await user_farm_channel.send(embed=extrato_embed)
        await interaction.response.send_message(f"✅ Extrato enviado! Seu registro de farm foi enviado para {user_farm_channel.mention} e salvo no QG Kurogumi.", ephemeral=True)

# (O resto do código, FarmPanelView e on_ready, continua exatamente o mesmo)

class FarmPanelView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
    
    @discord.ui.button(label="Criar Sala de Farm", style=discord.ButtonStyle.primary, emoji="🏠", custom_id="create_farm_room_button")
    async def create_farm_room(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Iniciando sua Sala de Farm...", ephemeral=True)
        guild = interaction.guild
        user = interaction.user

        try:
            cell = total_worksheet.find(str(user.id), in_column=1)
            if cell:
                for channel_check in guild.text_channels:
                     if channel_check.topic == f"farm_owner:{user.id}":
                        await interaction.followup.send(f"Você já possui uma **Sala de Farm** e um registro na planilha. Sua sala ativa é a {channel_check.mention}!", ephemeral=True)
                        return
        except Exception as e:
            print(f"ERRO AO LER PLANILHA EM CREATE_FARM_ROOM: {e}")
            await interaction.followup.send("Ocorreu um erro ao verificar a planilha. Tente novamente.", ephemeral=True)
            return

        admin_role = guild.get_role(ADMIN_ROLE_ID)
        category = guild.get_channel(TICKET_CATEGORY_ID)
        
        channel_name = f"farm-{user.name}"
        overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
            user: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
            admin_role: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
        }
        
        try:
            new_channel = await guild.create_text_channel(
                name=channel_name,
                overwrites=overwrites,
                category=category,
                topic=f"farm_owner:{user.id}" 
            )
            total_worksheet.append_row([str(user.id), user.display_name, 0, 0])
            print(f"NOVO MEMBRO REGISTRADO EM TOTAIS: {user.display_name} ({user.id})")

        except Exception as e:
            await interaction.followup.send(f"Ocorreu um erro ao criar o canal ou registrar na planilha: {e}", ephemeral=True)
            return
        
        embed = discord.Embed(
            title=f"🏠 Sala de Farm de {user.display_name} | Kurogumi",
            description=f"Bem-vindo, {user.mention}! Esta é a sua **Sala de Farm**.\n\nUse o botão 'Registrar Farm' no **Painel de Farm** para enviar seus extratos para cá.",
            color=KUROGUMI_COLOR
        )
        embed.set_thumbnail(url=KUROGUMI_LOGO_URL)
        embed.set_footer(text=BOT_FOOTER_TEXT)
        
        await new_channel.send(embed=embed)
        await interaction.followup.send(f"Sua **Sala de Farm** foi estabelecida em {new_channel.mention} e seu registro foi criado no QG!", ephemeral=True)
    
    @discord.ui.button(label="Registrar Farm", style=discord.ButtonStyle.success, emoji="💲", custom_id="register_farm_button_main")
    async def register_farm(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(FarmModal())

@bot.event
async def on_ready():
    print(f'Bot conectado como {bot.user}')
    bot.add_view(FarmPanelView())
    
    if not log_worksheet.get_all_values():
        print(f"Aba '{LOG_SHEET_NAME}' vazia. Adicionando cabeçalho...")
        log_worksheet.append_row(["Data", "ID do Canal", "Nome do Usuário", "Quantidade Adicionada"])
    
    if not total_worksheet.get_all_values():
        print(f"Aba '{TOTAL_SHEET_NAME}' vazia. Adicionando cabeçalho...")
        total_worksheet.append_row(["ID do Membro", "Nome do Usuário", "Total de Itens", "Valor Total a Receber"])

    channel = bot.get_channel(SETUP_CHANNEL_ID)
    if not channel:
        print(f"ERRO: O canal de setup com ID {SETUP_CHANNEL_ID} não foi encontrado.")
        return
    message_found = False
    async for message in channel.history(limit=50):
        if message.author == bot.user and message.embeds:
            if message.embeds[0].title == "Painel de Farm Kurogumi":
                print("Mensagem de setup já existe.")
                message_found = True
                break
    if not message_found:
        print("Mensagem de setup não encontrada. Enviando uma nova...")
        embed = discord.Embed(
            title="🏴 Painel de Farm Kurogumi",
            description=(
                "Bem-vindo ao sistema de gerenciamento de farm da facção **Kurogumi**.\n"
                "Use os botões abaixo para gerenciar suas operações:\n\n"
                "🏠 **Criar Sala de Farm**: Crie sua sala privada para extratos e informações.\n"
                "💲 **Registrar Farm**: Informe os itens coletados em seu farm (requer uma sala criada)."
            ),
            color=KUROGUMI_COLOR
        )
        embed.set_thumbnail(url=KUROGUMI_LOGO_URL)
        embed.set_footer(text=BOT_FOOTER_TEXT)
        try:
            await channel.send(embed=embed, view=FarmPanelView())
            print("Mensagem de setup enviada com sucesso.")
        except discord.Forbidden:
            print(f"ERRO: O bot não tem permissão para enviar mensagens no canal {channel.name} (ID: {SETUP_CHANNEL_ID}).")

bot.run(TOKEN)