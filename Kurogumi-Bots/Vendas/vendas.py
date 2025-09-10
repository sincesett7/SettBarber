# vendas.py
import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
import re
from datetime import datetime

# --- CONFIGURAÇÃO INICIAL ---

# Carrega a variável TOKEN do arquivo .env
load_dotenv()
TOKEN = os.getenv('TOKEN')

# ⬇️⬇️⬇️ CONFIGURE OS IDs DOS SEUS CANAIS AQUI ⬇️⬇️⬇️
VENDER_CHANNEL_ID = 1413549701839458405  # SUBSTITUA O 0 PELO ID DO CANAL DE VENDAS
LOGS_CHANNEL_ID   = 1413549862661783582  # SUBSTITUA O 0 PELO ID DO CANAL DE LOGS
# ⬆️⬆️⬆️ FIM DA CONFIGURAÇÃO DOS CANAIS ⬆️⬆️⬆️


# Constantes do tema Kurogumi
KUROGUMI_LOGO_URL = "https://media.discordapp.net/attachments/1212524436364857395/1414395192928239707/image.png?ex=68bf69ac&is=68be182c&hm=1e54588558b939dd0bc8f690c67fa4ea48e27c806e55915c8172c2eacd61d1c1&=&format=webp&quality=lossless"
KUROGUMI_COR = 0xff1493 # Cor rosa/pink vibrante

# Define as intenções (permissões) do bot
intents = discord.Intents.default()
intents.message_content = True 

bot = commands.Bot(command_prefix="!", intents=intents)

# --- CLASSES DA INTERFACE (MODAL E VIEW) ---

class VendaModal(discord.ui.Modal, title="📝 Registro de Venda Kurogumi"):
    """Modal para o usuário preencher os dados da venda."""
    
    itens_vendidos = discord.ui.TextInput(
        label="Itens Vendidos:",
        style=discord.TextStyle.paragraph,
        placeholder="Ex: 1x Katana Afiada, 2x Armadura Samurai...",
        required=True,
        max_length=1024
    )
    valor_total = discord.ui.TextInput(
        label="Valor Total da Venda:",
        style=discord.TextStyle.short,
        placeholder="Ex: 150000",
        required=True,
        max_length=50
    )
    parceria = discord.ui.TextInput(
        label="Parceria:",
        style=discord.TextStyle.short,
        placeholder="Ex: Sim/Não",
        required=True,
        min_length=2,
        max_length=3
    )
    cliente_fac_org = discord.ui.TextInput(
        label="Cliente (Fac/Pista):",
        style=discord.TextStyle.short,
        placeholder="Ex: Clã da Lua Crescente",
        required=True,
        max_length=100
    )

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True, thinking=False)
        
        valor_str = self.valor_total.value
        try:
            valor_limpo = re.sub(r'[R$\s.]', '', valor_str).replace(',', '.')
            valor_float = float(valor_limpo)
        except ValueError:
            await interaction.followup.send(
                "❌ **Valor Inválido!** Por favor, insira um número válido para o valor da venda (ex: `1500` ou `1500,50`).", 
                ephemeral=True
            )
            return

        vendedor = interaction.user
        log_channel = bot.get_channel(LOGS_CHANNEL_ID)

        if not log_channel:
            await interaction.followup.send(
                "❌ Erro: O canal de logs não foi encontrado. Verifique o `LOGS_CHANNEL_ID` no código.", 
                ephemeral=True
            )
            return
            
        embed_resultado = discord.Embed(
            title="✔️ Venda Realizada com Sucesso! 💮",
            description="Um novo registro de venda foi adicionado aos nossos arquivos da Kurogumi.",
            color=KUROGUMI_COR,
            timestamp=datetime.now()
        )
        embed_resultado.set_author(name=vendedor.display_name, icon_url=vendedor.display_avatar.url)
        embed_resultado.set_thumbnail(url=KUROGUMI_LOGO_URL)
        
        embed_resultado.add_field(name="📦 Itens Vendidos:", value=f"```{self.itens_vendidos.value}```", inline=False)
        embed_resultado.add_field(name="💰 Valor Total:", value=f"**R$ {valor_float:,.2f}**".replace(",", "X").replace(".", ",").replace("X", "."), inline=True)
        embed_resultado.add_field(name="🤝 Parceria:", value=f"`{self.parceria.value}`", inline=False)
        embed_resultado.add_field(name="👤 Cliente (Fac/Pista):", value=f"`{self.cliente_fac_org.value}`", inline=False)
        embed_resultado.set_footer(text="Desenvolvido por SettLabs / By Since", icon_url=KUROGUMI_LOGO_URL)

        await log_channel.send(embed=embed_resultado)
        await interaction.followup.send(f"✅ Sua venda foi registrada com sucesso no canal {log_channel.mention}!", ephemeral=True)

    async def on_error(self, interaction: discord.Interaction, error: Exception):
        print(f"Erro no modal: {error}")
        await interaction.followup.send("Ocorreu um erro inesperado. Tente novamente.", ephemeral=True)

class VendaView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Registrar Venda", style=discord.ButtonStyle.success, custom_id="registrar_venda_kurogumi", emoji="📝")
    async def registrar_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        modal = VendaModal()
        await interaction.response.send_modal(modal)

# --- EVENTOS DO BOT ---

@bot.event
async def on_ready():
    print(f'Bot conectado como {bot.user}')
    bot.add_view(VendaView())
    
    # Validação dos IDs dos canais
    if VENDER_CHANNEL_ID == 0 or LOGS_CHANNEL_ID == 0:
        print("\n!!! ATENÇÃO: Os IDs dos canais não foram configurados no código. O bot não funcionará corretamente. !!!\n")
        return

    channel = bot.get_channel(VENDER_CHANNEL_ID)
    if not channel:
        print(f"ERRO: Canal de Vendas com ID {VENDER_CHANNEL_ID} não encontrado.")
        return

    mensagem_existente = False
    async for message in channel.history(limit=50):
        if message.author == bot.user and message.components:
            for component in message.components:
                if isinstance(component, discord.ActionRow):
                    for child in component.children:
                        if hasattr(child, 'custom_id') and child.custom_id == "registrar_venda_kurogumi":
                            print("Mensagem de registro já existe. Nenhuma ação necessária.")
                            mensagem_existente = True
                            break
                if mensagem_existente: break
        if mensagem_existente: break
            
    if not mensagem_existente:
        print("Nenhuma mensagem de registro encontrada. Enviando uma nova...")
        embed_inicial = discord.Embed(
            title="💮 Registrar Vendas KUROGUMI",
            description=(
                "Tenha em mãos as seguintes informações antes de prosseguir com o registro de venda para a Kurogumi:\n\n"
                "**✨ Detalhes Necessários:**\n"
                "- `Itens Vendidos:` A lista completa dos itens da transação.\n"
                "- `Valor da Venda:` O valor total da transação.\n"
                "- `Parceria:` Se a venda foi realizada em parceria (Sim/Não).\n"
                "- `Cliente (Fac/Pista):` O nome do cliente ou organização.\n\n"
                "Com todas as informações acima, clique no botão **\"Registrar Venda\"** abaixo para continuar. A Kurogumi agradece seu empenho! 🐉"
            ),
            color=KUROGUMI_COR
        )
        embed_inicial.set_thumbnail(url=KUROGUMI_LOGO_URL)
        embed_inicial.set_footer(text="Desenvolvido por SettLabs / By Since", icon_url=KUROGUMI_LOGO_URL)
        
        await channel.send(embed=embed_inicial, view=VendaView())
        print("Nova mensagem de registro enviada com sucesso.")

# --- INICIALIZAÇÃO DO BOT ---
if __name__ == "__main__":
    if TOKEN:
        bot.run(TOKEN)
    else:
        print("ERRO CRÍTICO: O TOKEN não foi encontrado no arquivo .env ou não foi carregado corretamente.")