import discord
from discord.ext import commands
from discord.ui import Button, View, Modal, TextInput
from datetime import datetime
import os
from dotenv import load_dotenv

# --- CONFIGURAÇÃO ---
# ATENÇÃO: Nunca coloque seu token diretamente no código em produção.
load_dotenv()
TOKEN = os.getenv('TOKEN')
GUILD_ID = 1407526687440109588
CANAL_LAVAGEM_ID = 1415121260995678270  # ID do canal onde a mensagem inicial será enviada
CANAL_REGISTRO_ID = 1415121310442459236  # ID do canal para registro das lavagens
# URL da logo da sua empresa ou equipe de vendas
EMPRESA_LOGO_URL = "https://media.discordapp.net/attachments/1212524436364857395/1414395192928239707/image.png?ex=68bf69ac&is=68be182c&hm=1e54588558b939dd0bc8f690c67fa4ea48e27c806e55915c8172c2eacd61d1c1&=&format=webp&quality=lossless"

# Define as permissões (intents) que o bot precisa
intents = discord.Intents.default()
intents.members = True

# Inicializa o bot
bot = commands.Bot(command_prefix="!", intents=intents)

# --- UI Classes ---
class ModalRegistroLavagem(Modal):
    """
    Modal (formulário pop-up) para o usuário registrar os detalhes da lavagem.
    """
    def __init__(self, porcentagem_comissao: float):
        super().__init__(title="Registro de Lavagem")
        self.porcentagem_comissao = porcentagem_comissao

        # Campos de texto para o usuário preencher
        self.valor = TextInput(label="Valor Total da Lavagem", placeholder="Ex: 500000", required=True)
        self.cliente = TextInput(label="FAC/Pista", placeholder="", required=True)
        self.parceria = TextInput(label="Parceria (Sim/Não)", placeholder="Ex: Sim", required=True)
        self.descricao = TextInput(label="Descrição (opcional)", placeholder="", required=False, style=discord.TextStyle.paragraph)

        self.add_item(self.valor)
        self.add_item(self.cliente)
        self.add_item(self.parceria)
        self.add_item(self.descricao)

    async def on_submit(self, interaction: discord.Interaction):
        """
        Esta função é chamada quando o usuário clica em "Enviar" no modal.
        """
        canal_registro = bot.get_channel(CANAL_REGISTRO_ID)
        if not canal_registro:
            return await interaction.response.send_message("Erro: Canal de registro de lavagem não encontrado. Contate a administração.", ephemeral=True)

        try:
            # Converte o valor para float e trata o uso de vírgula ou ponto
            valor_lavagem = float(self.valor.value.replace(',', '.'))
            if valor_lavagem <= 0:
                return await interaction.response.send_message("O valor da lavagem deve ser um número positivo.", ephemeral=True)
        except ValueError:
            return await interaction.response.send_message("O valor da lavagem deve ser um número válido.", ephemeral=True)

        # Realiza os cálculos de comissão e valor líquido
        comissao = valor_lavagem * self.porcentagem_comissao
        valor_liquido = valor_lavagem - comissao

        # Cria a embed de registro de lavagem
        embed_registro = discord.Embed(
            title="💰 Registro de Lavagem",
            description="✅ Lavagem Realizada com Sucesso!",
            color=0x228B22  # Verde para sucesso
        )
        embed_registro.set_author(name=interaction.user.display_name, icon_url=interaction.user.avatar.url)
        
        # Adiciona os campos com os valores exatos da sua imagem
        embed_registro.add_field(name="Quem Lavou:", value=interaction.user.mention, inline=False)
        embed_registro.add_field(name="Data da Lavagem:", value=f"<t:{int(datetime.now().timestamp())}:F>", inline=False)
        embed_registro.add_field(name="⬇️ Detalhes da Transação:", value="", inline=False)
        embed_registro.add_field(name="Valor Total:", value=f"R$ {valor_lavagem:,.2f}", inline=False)
        embed_registro.add_field(name=f"Valor Porcentagem ({int(self.porcentagem_comissao * 100)}%):", value=f"R$ {comissao:,.2f}", inline=False)
        embed_registro.add_field(name="✅ Lucro Líquido:", value=f"R$ {valor_liquido:,.2f}", inline=False)
        embed_registro.add_field(name="🤝 Parceria:", value=self.parceria.value, inline=False)
        embed_registro.add_field(name="FAC/Pista:", value=self.cliente.value, inline=False)

        if self.descricao.value:
            embed_registro.add_field(name="📝 Descrição", value=self.descricao.value, inline=False)
        
        # Adiciona o rodapé solicitado
        embed_registro.set_footer(text="Desenvolvido por SettLabs / By Since")
        
        # Envia a embed para o canal de registro
        await canal_registro.send(embed=embed_registro)
        # Responde ao usuário que a lavagem foi registrada
        await interaction.response.send_message("✅ Lavagem registrada com sucesso! Obrigado.", ephemeral=True)

class LavagemButtonsView(View):
    """
    View principal com botões para as comissões.
    """
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Lavagem 25%", style=discord.ButtonStyle.primary, custom_id="lavagem_25", emoji="💰")
    async def button_25_callback(self, interaction: discord.Interaction, button: Button):
        # Abre o modal com a porcentagem de 25%
        await interaction.response.send_modal(ModalRegistroLavagem(0.25))
        
    @discord.ui.button(label="Lavagem 30%", style=discord.ButtonStyle.success, custom_id="lavagem_30", emoji="💸")
    async def button_30_callback(self, interaction: discord.Interaction, button: Button):
        # Abre o modal com a porcentagem de 30%
        await interaction.response.send_modal(ModalRegistroLavagem(0.30))


# --- EVENTOS DO BOT ---
@bot.event
async def on_ready():
    """
    Executado quando o bot está online e pronto para interagir.
    """
    # Adiciona a view (botões) para que eles persistam entre reinicializações
    bot.add_view(LavagemButtonsView())
    
    print(f'Bot de Lavagem conectado como {bot.user}')

    canal_lavagem = bot.get_channel(CANAL_LAVAGEM_ID)
    if canal_lavagem:
        # Cria a embed inicial com instruções
        embed_inicial = discord.Embed(
            title="📈 Sistema de Registro de Lavagem",
            description="""
            Clique no botão abaixo correspondente à porcentagem da lavagem para registrar. Após a escolha, um formulário irá aparecer para você preencher os detalhes.
            """,
            color=0x228B22
        )
        embed_inicial.set_author(name="Lavagem Kurogumi", icon_url=EMPRESA_LOGO_URL)
        embed_inicial.set_thumbnail(url=EMPRESA_LOGO_URL)
        embed_inicial.set_footer(text="Desenvolvido por SettLabs / By Since")
        
        # Verifica se a mensagem inicial já existe no canal para evitar duplicatas
        mensagens = []
        try:
            async for m in canal_lavagem.history(limit=10):
                mensagens.append(m)
        except discord.errors.Forbidden:
            print(f"Erro: Não tenho permissão para ler o histórico do canal {CANAL_LAVAGEM_ID}. Verifique as permissões.")
            return

        # Se a mensagem não for encontrada, envia uma nova
        if not any(m.embeds and m.embeds[0].title and "Sistema de Registro de Lavagem" in m.embeds[0].title for m in mensagens):
            await canal_lavagem.send(embed=embed_inicial, view=LavagemButtonsView())
            print(f"Mensagem inicial de lavagem enviada para o canal: {canal_lavagem.name}")
        else:
            print("Mensagem inicial de lavagem já existe no canal. Não enviei uma nova.")
    else:
        print(f"Canal de lavagem com ID {CANAL_LAVAGEM_ID} não encontrado. Verifique se o ID está correto.")

# --- INICIA O BOT ---
bot.run(TOKEN)