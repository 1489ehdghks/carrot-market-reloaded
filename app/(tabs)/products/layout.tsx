export default function HomeLayout({children, modal}:{
    children: React.ReactNode,
    modal: React.ReactNode
}){
    return (
        <div>
          {children}
          {modal}
        </div>
      )

}